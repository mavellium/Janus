import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Sua senha precisa ter pelo menos 8 caracteres.')
  .regex(/[^a-zA-Z0-9]/, 'Adicione pelo menos um caractere especial (como @, #, !, etc).')
  .regex(/[0-9]/, 'Sua senha precisa ter pelo menos um número.')
  .refine(
    (password) =>
      !/(012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(
        password
      ),
    {
      message:
        'Evite usar sequências numéricas óbvias (como 123 ou 987).',
    }
  )
