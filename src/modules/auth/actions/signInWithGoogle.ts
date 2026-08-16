'use server'

import { signIn } from '@/lib/auth'
import { GOOGLE_PROVIDER_ID } from '@/lib/auth/oauth'
import { saveSessionPreference } from '@/lib/auth/session'

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const remember = formData.get('remember') === 'on'
  const email = formData.get('email')

  await saveSessionPreference(
    remember,
    typeof email === 'string' && email.includes('@') ? email.toLowerCase() : undefined,
  )

  await signIn(GOOGLE_PROVIDER_ID, { redirectTo: '/' })
}
