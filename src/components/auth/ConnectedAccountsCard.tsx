'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { formatDateTime } from '@/lib/utils'
import { setGoogleAuthEnabled } from '@/modules/auth/actions/setGoogleAuthEnabled'
import { unlinkGoogleAccount } from '@/modules/auth/actions/unlinkGoogleAccount'
import type { UserAuthMethods } from '@/modules/auth/queries/getUserAuthMethods'

interface ConnectedAccountsCardProps {
  userId: string
  userEmail: string
  methods: UserAuthMethods
  revalidate: string
  onNotify: (message: string, type: 'success' | 'error') => void
}

export function ConnectedAccountsCard({
  userId,
  userEmail,
  methods,
  revalidate,
  onNotify,
}: ConnectedAccountsCardProps) {
  const [enabled, setEnabled] = useState(methods.googleAuthEnabled)
  const [account, setAccount] = useState(methods.googleAccount)
  const [isPending, startTransition] = useTransition()

  if (!methods.googleProviderAvailable) return null

  function handleToggle(next: boolean) {
    setEnabled(next)
    startTransition(async () => {
      const result = await setGoogleAuthEnabled({ userId, enabled: next, revalidate })
      if (!result.ok) {
        setEnabled(!next)
        onNotify(result.error ?? 'Erro ao atualizar o login com Google', 'error')
        return
      }
      if (!next) setAccount(null)
      onNotify(
        next ? 'Login com Google ativado.' : 'Login com Google desativado.',
        'success',
      )
    })
  }

  function handleUnlink() {
    startTransition(async () => {
      const result = await unlinkGoogleAccount({ userId, revalidate })
      if (!result.ok) {
        onNotify(result.error ?? 'Erro ao desvincular a conta Google', 'error')
        return
      }
      setAccount(null)
      onNotify('Conta Google desvinculada.', 'success')
    })
  }

  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-brand-text">Contas conectadas</h2>
          <p className="text-sm text-brand-muted">
            Controle o acesso à sua conta por provedores externos
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="googleAuthEnabled" className="font-medium">
                Entrar com Google
              </Label>
              <p className="text-xs text-brand-muted">
                Permite acessar o Janus com a conta Google de {userEmail}
              </p>
            </div>
            <Switch
              id="googleAuthEnabled"
              checked={enabled}
              disabled={isPending}
              onCheckedChange={handleToggle}
            />
          </div>

          <Separator />

          {account ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-brand-muted">
                <p className="text-sm font-medium text-brand-text">
                  {account.providerEmail ?? userEmail}
                </p>
                <p>Vinculada em {formatDateTime(account.linkedAt)}</p>
                {account.lastLoginAt && (
                  <p>Último acesso por Google em {formatDateTime(account.lastLoginAt)}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlink}
                disabled={isPending}
              >
                {isPending ? 'Processando...' : 'Desvincular'}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-brand-muted">
              {enabled
                ? 'Nenhuma conta Google vinculada. O vínculo é criado no primeiro acesso pelo botão “Entrar com Google” na tela de login.'
                : 'Login com Google desativado para esta conta.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
