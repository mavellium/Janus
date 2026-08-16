import { headers } from 'next/headers'

export async function appBaseUrl(): Promise<string> {
  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
  if (configured) return configured.replace(/\/+$/, '')

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}
