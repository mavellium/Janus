const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export interface SendMailInput {
  to: string
  subject: string
  html: string
  text: string
}

export type SendMailResult = { ok: true } | { ok: false; error: string }

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM)
}

export async function sendMail({ to, subject, html, text }: SendMailInput): Promise<SendMailResult> {
  if (!isMailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'Serviço de e-mail não configurado.' }
    }
    console.info(
      `[mail] RESEND_API_KEY/MAIL_FROM ausentes — e-mail não enviado.\nPara: ${to}\nAssunto: ${subject}\n${text}`,
    )
    return { ok: true }
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [to],
        subject,
        html,
        text,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[mail] Resend respondeu com erro:', response.status, await response.text())
      return { ok: false, error: 'Não foi possível enviar o e-mail agora.' }
    }

    return { ok: true }
  } catch (error) {
    console.error('[mail] Falha ao chamar a API de e-mail:', error)
    return { ok: false, error: 'Não foi possível enviar o e-mail agora.' }
  }
}
