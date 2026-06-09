import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const profile = await getCurrentProfile()
  if (profile) redirect('/dashboard')

  const { error } = await searchParams

  return <LandingPage error={error} />
}
