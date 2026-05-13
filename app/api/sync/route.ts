import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getStravaActivities, getValidToken } from '@/lib/strava'
import { calculateRunXP, getLevelFromXP } from '@/lib/xp'
import { checkNewAchievements } from '@/lib/achievements'
import { calcFriendshipXP, getFriendshipLevel, friendshipKey } from '@/lib/friendship'
import { reverseGeocode } from '@/lib/geocoding'
import { checkAutoQuests, ALL_QUESTS, QuestCheckContext } from '@/lib/quests'

export async function POST() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()

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

  const { data: existing } = await supabase
    .from('activities')
    .select('strava_id')
    .eq('user_id', profile.id)

  const existingIds = new Set((existing ?? []).map((a) => a.strava_id))

  const page1 = await getStravaActivities(accessToken, 1, 100)
  const page2 = await getStravaActivities(accessToken, 2, 100)
  const allActivities = [...page1, ...page2]

  const runs = allActivities.filter(
    (a: any) => a.type === 'Run' && !existingIds.has(a.id)
  )

  if (!runs.length) {
    return NextResponse.json({ synced: 0, message: 'Already up to date' })
  }

  const { data: existingActivities } = await supabase
    .from('activities')
    .select('distance, moving_time')
    .eq('user_id', profile.id)

  const prMap = new Map<string, number>()
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

  // Build rows with geocoding (rate-limited at 1 req/sec per Nominatim ToS)
  const toInsert = []
  for (const a of runs) {
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

    const lat: number | null = a.start_latlng?.[0] ?? null
    const lng: number | null = a.start_latlng?.[1] ?? null

    let city: string | null = null
    let country: string | null = null
    let country_code: string | null = null

    if (lat !== null && lng !== null) {
      const geo = await reverseGeocode(lat, lng)
      city = geo.city
      country = geo.country
      country_code = geo.country_code
      // Nominatim rate limit: 1 req/sec
      await new Promise((r) => setTimeout(r, 1100))
    }

    toInsert.push({
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
      elev_high: a.elev_high ?? null,
      start_lat: lat,
      start_lng: lng,
      city,
      country,
      country_code,
    })
  }

  await supabase.from('activities').insert(toInsert)

  const { data: allUserActivities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', profile.id)

  const totalXP = (allUserActivities ?? []).reduce((sum, a) => sum + (a.xp_earned ?? 0), 0)
  const level = getLevelFromXP(totalXP)

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

  // Check auto quests
  const { data: completedQuestRows } = await supabase
    .from('user_quests')
    .select('quest_slug')
    .eq('user_id', profile.id)
    .eq('status', 'completed')

  const completedQuestSlugs = new Set((completedQuestRows ?? []).map((r) => r.quest_slug))

  const { data: friendshipRows } = await supabase
    .from('friendships')
    .select('id, total_km, run_count')
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)

  const distinctFriendCount = friendshipRows?.length ?? 0
  const totalSharedKm = (friendshipRows ?? []).reduce((s, f) => s + (f.total_km ?? 0), 0)
  const sharedRunCount = (friendshipRows ?? []).reduce((s, f) => s + (f.run_count ?? 0), 0)

  const questCtx: QuestCheckContext = {
    activities: allUserActivities ?? [],
    profile: { ...profile, current_streak: streak },
    distinctFriendCount,
    totalSharedKm,
    sharedRunCount,
  }

  const newlyCompletedQuests = checkAutoQuests(questCtx, completedQuestSlugs)

  if (newlyCompletedQuests.length) {
    await supabase.from('user_quests').upsert(
      newlyCompletedQuests.map((q) => ({
        user_id: profile.id,
        quest_slug: q.slug,
        status: 'completed',
        progress: 1,
        completed_at: new Date().toISOString(),
      })),
      { onConflict: 'user_id,quest_slug' }
    )
    finalXP += newlyCompletedQuests.reduce((sum, q) => sum + q.xp_reward, 0)
  }

  // Process run pairings
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

    const { data: myRuns } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', profile.id)
      .gte('start_date', `${today}T00:00:00`)
      .lte('start_date', `${today}T23:59:59`)

    const { data: partnerRuns } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', partnerId)
      .gte('start_date', `${today}T00:00:00`)
      .lte('start_date', `${today}T23:59:59`)

    if (!myRuns?.length || !partnerRuns?.length) continue

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

    if (existingSharedRun) continue

    const myRun = myRuns[0]
    const partnerRun = partnerRuns[0]
    const myKm = myRun.distance / 1000
    const partnerKm = partnerRun.distance / 1000
    const friendshipXP = calcFriendshipXP(myKm, partnerKm)

    const bonusXP = myRun.xp_earned
    await supabase
      .from('activities')
      .update({ xp_earned: myRun.xp_earned * 2 })
      .eq('id', myRun.id)
    finalXP += bonusXP

    let friendshipId: string
    if (existingFriendship) {
      const newFriendshipXP = existingFriendship.friendship_xp + friendshipXP
      await supabase
        .from('friendships')
        .update({
          total_km: existingFriendship.total_km + Math.min(myKm, partnerKm),
          total_time_seconds:
            existingFriendship.total_time_seconds + Math.min(myRun.moving_time, partnerRun.moving_time),
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

    await supabase
      .from('run_pairings')
      .update({ status: 'used' })
      .eq('id', pairing.id)

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
    newQuests: newlyCompletedQuests.map((q) => q.name),
    sharedRuns: sharedRunsCreated.length,
    totalXP: finalXP,
    level: getLevelFromXP(finalXP),
  })
}
