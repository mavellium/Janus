export const GOOGLE_PROVIDER_ID = 'google'

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    (process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID) &&
      (process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET),
  )
}
