import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role === 'DEVELOPER') {
    redirect(`/dev/${session.user.id}/dashboard`)
  }

  redirect(`/${session.user.companySlug}/dashboard`)
}
