import { redirect } from 'next/navigation'
import DevTools from './DevTools'

export default function DevPage() {
  if (process.env.NODE_ENV === 'production') redirect('/dashboard')
  return <DevTools />
}
