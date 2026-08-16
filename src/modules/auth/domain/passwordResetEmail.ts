import { PASSWORD_RESET_TTL_MINUTES } from './passwordReset'

interface PasswordResetEmailInput {
  name: string | null
  resetUrl: string
}

export function buildPasswordResetEmail({ name, resetUrl }: PasswordResetEmailInput) {
  const greeting = name ? `Olá, ${name}` : 'Olá'

  const text = [
    `${greeting},`,
    '',
    'Recebemos um pedido para redefinir a senha da sua conta Janus.',
    `Abra o link abaixo para criar uma nova senha (válido por ${PASSWORD_RESET_TTL_MINUTES} minutos):`,
    resetUrl,
    '',
    'Se você não solicitou a redefinição, ignore este e-mail — sua senha atual continua válida.',
  ].join('\n')

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <tr>
        <td>
          <p style="margin:0 0 16px;font-size:16px;font-weight:600">${greeting},</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6">
            Recebemos um pedido para redefinir a senha da sua conta <strong>Janus</strong>.
          </p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6">
            O link abaixo é válido por ${PASSWORD_RESET_TTL_MINUTES} minutos e pode ser usado uma única vez.
          </p>
          <p style="margin:0 0 24px">
            <a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500">
              Criar nova senha
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:12px;color:#71717a;line-height:1.6">
            Se o botão não funcionar, copie e cole este endereço no navegador:
          </p>
          <p style="margin:0 0 24px;font-size:12px;color:#71717a;word-break:break-all">${resetUrl}</p>
          <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6">
            Se você não solicitou a redefinição, ignore este e-mail — sua senha atual continua válida.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject: 'Redefinição de senha — Janus', html, text }
}
