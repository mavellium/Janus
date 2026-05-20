export async function revalidateSites() {
  const siteUrl = process.env.MAVELLIUM_SITE_URL
  const token = process.env.MAVELLIUM_REVALIDATE_TOKEN
  if (!siteUrl || !token) return

  try {
    await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-token': token },
    })
  } catch {
    // Falha silenciosa — não bloqueia a action
  }
}
