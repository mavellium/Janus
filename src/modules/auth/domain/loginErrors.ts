const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  ip_blocked: 'Acesso suspenso. Múltiplas tentativas falhas detectadas.',
  google_unverified:
    'Não foi possível confirmar o e-mail dessa conta Google. Use e-mail e senha.',
  google_no_account:
    'Nenhuma conta Janus usa esse e-mail do Google. Fale com o administrador da sua empresa.',
  google_disabled:
    'O login com Google está desativado para essa conta. Ative em Configurações › Segurança.',
  google_reset_required:
    'Sua conta ainda usa uma senha provisória. Entre com e-mail e senha para definir a definitiva.',
  OAuthAccountNotLinked: 'Esse e-mail já está associado a outra forma de login.',
  OAuthSignin: 'Não foi possível iniciar o login com Google. Tente novamente.',
  OAuthCallbackError: 'O Google não concluiu o login. Tente novamente.',
  AccessDenied: 'Acesso negado para essa conta.',
  Configuration: 'Login com Google indisponível: configuração incompleta no servidor.',
}

export function loginErrorMessage(code?: string | null): string | null {
  if (!code) return null
  return (
    LOGIN_ERROR_MESSAGES[code] ?? 'Não foi possível concluir o login. Tente novamente.'
  )
}
