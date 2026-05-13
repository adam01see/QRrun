const STRAVA_BASE = 'https://www.strava.com/api/v3'

export function getStravaAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/strava/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error('Failed to exchange Strava code')
  return res.json()
}

export async function refreshStravaToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Failed to refresh Strava token')
  return res.json()
}

export async function getStravaActivities(accessToken: string, page = 1, perPage = 100) {
  const res = await fetch(
    `${STRAVA_BASE}/athlete/activities?page=${page}&per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error('Failed to fetch Strava activities')
  return res.json()
}

export async function getStravaAthlete(accessToken: string) {
  const res = await fetch(`${STRAVA_BASE}/athlete`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Strava athlete')
  return res.json()
}

// Ensure token is fresh before making API calls
export async function getValidToken(profile: {
  strava_access_token: string
  strava_refresh_token: string
  token_expires_at: number
}) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (profile.token_expires_at > nowSeconds + 300) {
    return { accessToken: profile.strava_access_token, refreshed: false, newTokenData: null }
  }
  const newTokenData = await refreshStravaToken(profile.strava_refresh_token)
  return {
    accessToken: newTokenData.access_token,
    refreshed: true,
    newTokenData,
  }
}
