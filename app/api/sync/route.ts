import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getStravaActivities, getValidToken } from '@/lib/strava'
import { calculateRunXP, getLevelFromXP } from '@/lib/xp'
import { checkNewAchievements } from '@/lib/achievements'
import { calcFriendshipXP, getFriendshipLevel, friendshipKey } from '@/lib/friendship'

export async function POST() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()

  // Refresh token if needed
  const { accessToken, refreshed, newTokenData } = await getValidToken(profile)
  if (refreshed && newTokenData) {
    await supabase
      .from('profiles')
      .update({
        strava_access_token: newTokenData.access_token,
        strava_refresh_token: newTokenData.refresh_token,
        token_expires_at: newTokenData.expires_at,
      })
      .eq('id', profile.id)
  }

  // Fetch existing strava IDs so we don't re-insert
  const { data: existing } = await supabase
    .from('activities')
    .select('strava_id')
    .eq('user_id', profile.id)

  const existingIds = new Set((existing ?? []).map((a) => a.strava_id))

  // Pull up to 200 activities (2 pages)
  const page1 = await getStravaActivities(accessToken, 1, 100)
  const page2 = await getStravaActivities(accessToken, 2, 100)
  const allActivities = [...page1, ...page2]

  const runs = allActivities.filter(
    (a: any) => a.type === 'Run' && !existingIds.has(a.id)
  )

  if (!runs.length) {
    return NextResponse.json({ synced: 0, message: 'Already up to date' })
  }

  // Get existing activities for PR detection
  const { data: existingActivities } = await supabase
    .from('activities')
    .select('distance, moving_time')
    .eq('user_id', profile.id)

  // Track best time per distance bucket for PR detection
  const prMap = new Map<string, number>() // bucket → best time (seconds)
  const bucket = (m: number) => {
    if (m < 6000) return '5k'
    if (m < 12000) return '10k'
    if (m < 25000) return 'half'
    return 'marathon'
  }

  for (const a of existingActivities ?? []) {
    const b = bucket(a.distance)
    const current = prMap.get(b) ?? Infinity
    if (a.moving_time < current) prMap.set(b, a.moving_time)
  }

  const toInsert = runs.map((a: any) => {
    const b = bucket(a.distance)
    const bestSoFar = prMap.get(b) ?? Infinity
    const isPR = a.moving_time < bestSoFar
    if (isPR) prMap.set(b, a.moving_time)

    const partial = {
      distance: a.distance,
      moving_time: a.moving_time,
      workout_type: a.workout_type ?? 0,
      is_pr: isPR,
    }

    return {
      user_id: profile.id,
      strava_id: a.id,
      name: a.name,
      distance: a.distance,
      moving_time: a.moving_time,
      elapsed_time: a.elapsed_time,
      start_date: a.start_date,
      average_speed: a.average_speed,
      average_heartrate: a.average_heartrate ?? null,
      max_heartrate: a.max_heartrate ?? null,
      total_elevation_gain: a.total_elevation_gain,
      workout_type: a.workout_type ?? 0,
      xp_earned: calculateRunXP(partial),
      is_pr: isPR,
    }
  })

  await supabase.from('activities').insert(toInsert)

  // Recalculate total XP
  const { data: allUserActivities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', profile.id)

  const totalXP = (allUserActivities ?? []).reduce((sum, a) => sum + (a.xp_earned ?? 0), 0)
  const level = getLevelFromXP(totalXP)

  // Check streak
  const dates = (allUserActivities ?? [])
    .map((a) => a.start_date.split('T')[0])
    .sort()
    .reverse()

  let streak = 0
  let checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)

  for (const d of [...new Set(dates)]) {
    const runDate = new Date(d)
    const diff = Math.floor((checkDate.getTime() - runDate.getTime()) / 86400000)
    if (diff <= 1) {
      streak++
      checkDate = runDate
    } else {
      break
    }
  }

  await supabase
    .from('profiles')
    .update({
      total_xp: totalXP,
      level,
      current_streak: streak,
      longest_streak: Math.max(profile.longest_streak, streak),
      last_run_date: dates[0] ?? null,
    })
    .eq('id', profile.id)

  // Check achievements
  const { data: earnedRows } = await supabase
    .from('user_achievements')
    .select('achievement_slug')
    .eq('user_id', profile.id)

  const earnedSlugs = (earnedRows ?? []).map((r) => r.achievement_slug)
  const newAchievements = checkNewAchievements(allUserActivities ?? [], earnedSlugs)

  let finalXP = totalXP

  if (newAchievements.length) {
    await supabase.from('user_achievements').insert(
      newAchievements.map((a) => ({
        user_id: profile.id,
        achievement_slug: a.slug,
      }))
    )
    finalXP += newAchievements.reduce((sum, a) => sum + a.xp_reward, 0)
  }

  // Process active pairings — find runs today that match a partner's runs
  const today = new Date().toISOString().split('T')[0]
  const { data: pairings } = await supabase
    .from('run_pairings')
    .select('*')
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .eq('paired_date', today)
    .eq('status', 'active')

  const sharedRunsCreated: string[] = []

  for (const pairing of pairings ?? []) {
    const partnerId = pairing.user1_id === profile.id ? pairing.user2_id : pairing.user1_id

    // Get my runs today
    const { data: myRuns } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', profile.id)
      .gte('start_date', `${today}T00:00:00`)
      .lte('start_date', `${today}T23:59:59`)

    // Get partner's runs today
    const { data: partnerRuns } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', partnerId)
      .gte('start_date', `${today}T00:00:00`)
      .lte('start_date', `${today}T23:59:59`)

    if (!myRuns?.length || !partnerRuns?.length) continue

    // Check if this pairing already produced a shared_run today
    const [u1, u2] = friendshipKey(profile.id, partnerId)
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, total_km, total_time_seconds, run_count, friendship_xp')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .single()

    const { data: existingSharedRun } = await supabase
      .from('shared_runs')
      .select('id')
      .eq('friendship_id', existingFriendship?.id ?? '')
      .eq('run_date', today)
      .single()

    if (existingSharedRun) continue // already processed today

    const myRun = myRuns[0]
    const partnerRun = partnerRuns[0]
    const myKm = myRun.distance / 1000
    const partnerKm = partnerRun.distance / 1000
    const friendshipXP = calcFriendshipXP(myKm, partnerKm)

    // Double XP for my run
    const bonusXP = myRun.xp_earned
    await supabase
      .from('activities')
      .update({ xp_earned: myRun.xp_earned * 2 })
      .eq('id', myRun.id)
    finalXP += bonusXP

    // Upsert friendship
    let friendshipId: string
    if (existingFriendship) {
      const newFriendshipXP = existingFriendship.friendship_xp + friendshipXP
      await supabase
        .from('friendships')
        .update({
          total_km: existingFriendship.total_km + Math.min(myKm, partnerKm),
          total_time_seconds: existingFriendship.total_time_seconds + Math.min(myRun.moving_time, partnerRun.moving_time),
          run_count: existingFriendship.run_count + 1,
          friendship_xp: newFriendshipXP,
          friendship_level: getFriendshipLevel(newFriendshipXP),
        })
        .eq('id', existingFriendship.id)
      friendshipId = existingFriendship.id
    } else {
      const { data: newFriendship } = await supabase
        .from('friendships')
        .insert({
          user1_id: u1,
          user2_id: u2,
          total_km: Math.min(myKm, partnerKm),
          total_time_seconds: Math.min(myRun.moving_time, partnerRun.moving_time),
          run_count: 1,
          friendship_xp: friendshipXP,
          friendship_level: getFriendshipLevel(friendshipXP),
        })
        .select()
        .single()
      friendshipId = newFriendship!.id
    }

    await supabase.from('shared_runs').insert({
      friendship_id: friendshipId,
      user1_activity_id: u1 === profile.id ? myRun.id : partnerRun.id,
      user2_activity_id: u1 === profile.id ? partnerRun.id : myRun.id,
      run_date: today,
      shared_km: Math.min(myKm, partnerKm),
      friendship_xp_earned: friendshipXP,
    })

    // Mark pairing as used
    await supabase
      .from('run_pairings')
      .update({ status: 'used' })
      .eq('id', pairing.id)

    // Also double XP for partner's run (update their profile XP too)
    await supabase
      .from('activities')
      .update({ xp_earned: partnerRun.xp_earned * 2 })
      .eq('id', partnerRun.id)

    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('total_xp, level')
      .eq('id', partnerId)
      .single()

    if (partnerProfile) {
      const partnerNewXP = partnerProfile.total_xp + partnerRun.xp_earned
      await supabase
        .from('profiles')
        .update({ total_xp: partnerNewXP, level: getLevelFromXP(partnerNewXP) })
        .eq('id', partnerId)
    }

    sharedRunsCreated.push(partnerId)
  }

  await supabase
    .from('profiles')
    .update({ total_xp: finalXP, level: getLevelFromXP(finalXP) })
    .eq('id', profile.id)

  return NextResponse.json({
    synced: toInsert.length,
    newAchievements: newAchievements.map((a) => a.name),
    sharedRuns: sharedRunsCreated.length,
    totalXP: finalXP,
    level: getLevelFromXP(finalXP),
  })
}
