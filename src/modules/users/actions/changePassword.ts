'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { hash } from 'bcryptjs'
import { logAudit } from '@/lib/audit-logger'

interface ChangePasswordParams {
  userId: string
  currentPassword: string
  newPassword: string
}

export async function changePassword({
  userId,
  currentPassword,
  newPassword,
}: ChangePasswordParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  if (session.user.id !== userId) {
    return { ok: false, error: 'Acesso negado' }
  }

  // Função de validação de força de senha
  const validatePasswordStrength = (password: string): { isValid: boolean; error: string } => {
    // Comprimento mínimo
    if (password.length < 8) {
      return { isValid: false, error: 'A senha deve ter pelo menos 8 caracteres' }
    }

    // Máximo 50 caracteres
    if (password.length > 50) {
      return { isValid: false, error: 'A senha deve ter no máximo 50 caracteres' }
    }

    // Verificar se contém pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'A senha deve conter pelo menos uma letra maiúscula' }
    }

    // Verificar se contém pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'A senha deve conter pelo menos uma letra minúscula' }
    }

    // Verificar se contém pelo menos um número
    if (!/\d/.test(password)) {
      return { isValid: false, error: 'A senha deve conter pelo menos um número' }
    }

    // Verificar se contém pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, error: 'A senha deve conter pelo menos um caractere especial (!@#$%^&* etc.)' }
    }

    // Verificar sequências comuns (numéricas)
    const commonSequences = ['12345678', '23456789', '01234567', '87654321', '98765432']
    for (const seq of commonSequences) {
      if (password.includes(seq)) {
        return { isValid: false, error: 'A senha não pode conter sequências numéricas comuns (ex: 12345678)' }
      }
    }

    // Verificar sequências de teclado
    const keyboardSequences = ['qwerty', 'asdfgh', 'zxcvbn', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm']
    for (const seq of keyboardSequences) {
      if (password.toLowerCase().includes(seq)) {
        return { isValid: false, error: 'A senha não pode conter sequências de teclado (ex: qwerty, asdfgh)' }
      }
    }

    // Verificar senhas muito comuns/fracas
    const commonPasswords = [
      'password', '12345678', 'qwerty123', 'admin123', 'letmein', 'welcome',
      'monkey123', 'dragon123', 'master123', 'sunshine123', 'princess123'
    ]
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return { isValid: false, error: 'A senha é muito comum. Escolha uma senha mais segura e original' }
    }

    // Verificar se contém informações pessoais básicos (nome, email)
    if (currentPassword && password.toLowerCase().includes(currentPassword.toLowerCase())) {
      return { isValid: false, error: 'A nova senha não pode ser similar à senha atual' }
    }

    // Verificar repetição de caracteres (ex: aaaaaaaa, 11111111)
    if (/(.)\1{3,}/.test(password)) {
      return { isValid: false, error: 'A senha não pode conter mais de 3 caracteres repetidos seguidos' }
    }

    return { isValid: true, error: '' }
  }

  // Validações básicas
  if (!currentPassword || !newPassword) {
    return {
      ok: false,
      error: 'Preencha todos os campos de senha',
    }
  }

  // Validar força da nova senha
  const passwordValidation = validatePasswordStrength(newPassword)
  if (!passwordValidation.isValid) {
    return {
      ok: false,
      error: passwordValidation.error,
    }
  }

  try {
    // Buscar usuário do banco
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true }
    })

    if (!user) {
      return { ok: false, error: 'Usuário não encontrado' }
    }

    // Verificar se a senha atual está correta
    const isCurrentPasswordValid = await compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return { ok: false, error: 'Senha atual incorreta' }
    }

    // Hash da nova senha
    const hashedNewPassword = await hash(newPassword, 12)

    // Atualizar senha no banco
    await db.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      entityLabel: 'Alteração de senha',
      newData: { passwordChanged: true },
    })

    return { ok: true }

  } catch (error) {
    console.error('[changePassword]', error)
    return { ok: false, error: 'Erro ao alterar senha' }
  }
}
