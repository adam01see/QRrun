import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getStravaAthlete } from '@/lib/strava'
import { getSupabaseAdmin } from '@/lib/supabase'
import { setSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/?error=strava_denied', req.url))
  }

  try {
    const tokenData = await exchangeCodeForTokens(code)
    const athlete = tokenData.athlete ?? await getStravaAthlete(tokenData.access_token)

    const supabase = getSupabaseAdmin()
    const { data: profile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          strava_id: athlete.id,
          username: athlete.username,
          firstname: athlete.firstname,
          lastname: athlete.lastname,
          profile_photo: athlete.profile,
          strava_access_token: tokenData.access_token,
          strava_refresh_token: tokenData.refresh_token,
          token_expires_at: tokenData.expires_at,
        },
        { onConflict: 'strava_id' }
      )
      .select()
      .single()

    if (upsertError || !profile) {
      console.error('Upsert error:', upsertError)
      return NextResponse.redirect(new URL('/?error=db_error', req.url))
    }

    await setSession(profile.id)
    const cookieStore = await cookies()
    const returnTo = cookieStore.get('rq_return_to')?.value
    cookieStore.delete('rq_return_to')
    const destination = returnTo ?? '/dashboard'
    return NextResponse.redirect(new URL(destination, req.url))
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }
}
