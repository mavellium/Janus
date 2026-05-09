import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()
  const companySlug = session?.user?.companySlug || 'default'
  redirect(`/${companySlug}/dashboard`)
}
