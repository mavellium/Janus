import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FirstAccessClient } from './FirstAccessClient'

export const metadata = { title: 'Primeiro Acesso' }

export default async function FirstAccessPage() {
  const session = await auth()

  if (!session?.user?.id) redirect('/login')

  return <FirstAccessClient />
}
