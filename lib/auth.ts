import { cookies } from 'next/headers'
import { getSupabaseAdmin } from './supabase'
import { Profile } from '@/types'

const SESSION_COOKIE = 'rq_session'

export async function setSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const userId = await getSession()
  if (!userId) return null

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return data ?? null
}
