import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import { getStravaAuthUrl } from '@/lib/strava'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get('returnTo')
  if (returnTo) {
    const cookieStore = await cookies()
    cookieStore.set('rq_return_to', returnTo, { httpOnly: true, maxAge: 300, path: '/' })
  }
  redirect(getStravaAuthUrl())
}
