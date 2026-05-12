'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, Clock } from 'lucide-react'
import { updateProfile } from '@/modules/users/actions/updateProfile'
import { changePassword } from '@/modules/users/actions/changePassword'
import { updatePreferences } from '@/modules/users/actions/updatePreferences'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { UpdateAvatarModal } from '@/components/users/update-avatar-modal'
import type { UserPreferences } from '@/types/next-auth'

interface DevSettingsClientProps {
  user: {
    id: string
    email: string
    name: string
    phone?: string
    image: string | null
    requiresPasswordReset?: boolean
    preferences: UserPreferences
  }
}

export function DevSettingsClient({ user }: DevSettingsClientProps) {
  const [name, setName] = useState(user.name || '')
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone || '')
  const [userImage, setUserImage] = useState(user.image)
  const [isProfilePending, startProfileTransition] = useTransition()
  const [isPasswordPending, startPasswordTransition] = useTransition()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [darkModeEnabled, setDarkModeEnabled] = useState(user.preferences?.darkMode || false)
  const [, startPreferencesTransition] = useTransition()
  const { toasts, toast, removeToast } = useToast()

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 2) {
      setPhone(value)
    } else if (value.length <= 6) {
      setPhone(`(${value.slice(0, 2)}) ${value.slice(2)}`)
    } else if (value.length <= 10) {
      setPhone(`(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`)
    } else {
      setPhone(`(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`)
    }
  }

  const handleProfileSave = () => {
    if (!name.trim() || !email.trim() || !email.includes('@')) {
      toast({ message: 'Preencha nome e e-mail válidos', type: 'error' })
      return
    }
    startProfileTransition(async () => {
      const result = await updateProfile({ userId: user.id, name: name.trim(), email: email.trim(), phone: phone.trim() || undefined })
      if (result.ok) {
        toast({ message: 'Perfil atualizado!', type: 'success' })
      } else {
        toast({ message: result.error || 'Erro ao atualizar perfil', type: 'error' })
      }
    })
  }

  const handlePasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      toast({ message: 'As senhas não coincidem', type: 'error' })
      return
    }
    startPasswordTransition(async () => {
      const result = await changePassword({ userId: user.id, currentPassword, newPassword })
      if (result.ok) {
        toast({ message: 'Senha atualizada!', type: 'success' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast({ message: result.error || 'Erro ao atualizar senha', type: 'error' })
      }
    })
  }

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkModeEnabled(checked)
    startPreferencesTransition(async () => {
      const result = await updatePreferences({ darkMode: checked })
      if (result.ok) {
        if (checked) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        toast({ message: `Tema ${checked ? 'escuro' : 'claro'} ativado!`, type: 'success' })
      } else {
        setDarkModeEnabled(!checked)
        toast({ message: 'Erro ao salvar preferências', type: 'error' })
      }
    })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text">Configurações</h1>
        <p className="text-sm text-brand-muted mt-1">Gerencie seu perfil e preferências</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-brand-text">Informações Pessoais</h2>
              <p className="text-sm text-brand-muted">Atualize seus dados de perfil</p>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userImage || undefined} />
                <AvatarFallback className="text-xl bg-brand-btn-light text-brand-primary">
                  {name.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <UpdateAvatarModal userId={user.id} currentImage={userImage} onAvatarUpdate={setUserImage} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={phone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" maxLength={15} />
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleProfileSave} disabled={isProfilePending}>
                {isProfilePending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-brand-text">Segurança</h2>
              <p className="text-sm text-brand-muted">Altere sua senha de acesso</p>
            </div>

            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
              {user.requiresPasswordReset ? (
                <>
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Redefinição de Senha Pendente</p>
                    <p className="text-xs text-yellow-600 opacity-75">Você ainda não redefiniu sua senha no primeiro acesso</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-600">Senha Segura</p>
                    <p className="text-xs text-green-600 opacity-75">Sua senha já foi redefinida com sucesso</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handlePasswordUpdate} disabled={isPasswordPending}>
                {isPasswordPending ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-brand-text">Preferências</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Tema Escuro</Label>
                <p className="text-xs text-brand-muted">Ative o modo escuro da interface</p>
              </div>
              <Switch checked={darkModeEnabled} onCheckedChange={handleDarkModeToggle} />
            </div>
          </CardContent>
        </Card>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
