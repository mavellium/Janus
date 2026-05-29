"use client";

import { useState, useTransition, useEffect, useActionState } from "react";
import { useTheme } from "@/components/ThemeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { updateProfile } from "@/modules/users/actions/updateProfile";
import { changePassword } from "@/modules/users/actions/changePassword";
import { updatePreferences } from "@/modules/users/actions/updatePreferences";
import { updateCompanyWebhook } from "@/modules/companies/actions/updateCompanyWebhook";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast-container";
import { UpdateAvatarModal } from "@/components/users/update-avatar-modal";
import type { UserPreferences } from "@/types/next-auth";

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    image: string | null;
    preferences: UserPreferences;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    webhookUrl: string | null;
    webhookToken: string | null;
  };
}

export function SettingsClient({ user, company }: SettingsClientProps) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [userImage, setUserImage] = useState(user.image);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const { toasts, toast, removeToast } = useToast();

  const [webhookState, webhookAction, isWebhookPending] = useActionState(
    updateCompanyWebhook,
    null,
  );

  useEffect(() => {
    if (!webhookState) return;
    if (webhookState.ok) {
      toast({ message: "Webhook salvo com sucesso!", type: "success" });
    } else {
      toast({
        message: webhookState.error || "Erro ao salvar webhook",
        type: "error",
      });
    }
  }, [webhookState]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { darkMode: darkModeEnabled, setDarkMode, setUserImage: setContextUserImage } = useTheme();
  const [, startPreferencesTransition] = useTransition();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length <= 11) {
      if (value.length <= 2) {
        value = value;
      } else if (value.length <= 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else if (value.length <= 10) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
      } else {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      }
    }

    setPhone(value);
  };

  const handleProfileSave = () => {
    if (!name.trim()) {
      toast({ message: "Nome é obrigatório", type: "error" });
      return;
    }

    if (!email.trim()) {
      toast({ message: "E-mail é obrigatório", type: "error" });
      return;
    }

    if (!email.includes("@")) {
      toast({ message: "E-mail inválido", type: "error" });
      return;
    }

    startProfileTransition(async () => {
      const result = await updateProfile({
        userId: user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      if (result.ok) {
        toast({ message: "Perfil atualizado com sucesso!", type: "success" });
      } else {
        toast({
          message: result.error || "Erro ao atualizar perfil",
          type: "error",
        });
      }
    });
  };

  const getPasswordStrengthMessage = (
    password: string,
  ): { isValid: boolean; message: string } => {
    if (!password) return { isValid: false, message: "" };

    const messages = [];

    if (password.length < 8) {
      messages.push("• Mínimo 8 caracteres");
    }

    if (!/[A-Z]/.test(password)) {
      messages.push("• 1 letra maiúscula");
    }

    if (!/[a-z]/.test(password)) {
      messages.push("• 1 letra minúscula");
    }

    if (!/\d/.test(password)) {
      messages.push("• 1 número");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      messages.push("• 1 caractere especial (!@#$%^&*)");
    }

    return {
      isValid: messages.length === 0,
      message: messages.join("\n"),
    };
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);

    startPreferencesTransition(async () => {
      const result = await updatePreferences({ darkMode: checked });

      if (result.ok) {
        toast({
          message: `Tema ${checked ? "escuro" : "claro"} ativado com sucesso!`,
          type: "success",
        });
      } else {
        toast({ message: "Erro ao salvar preferências", type: "error" });
        setDarkMode(!checked);
      }
    });
  };

  const handlePasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      toast({ message: "As senhas não coincidem", type: "error" });
      return;
    }

    startPasswordTransition(async () => {
      const result = await changePassword({
        userId: user.id,
        currentPassword,
        newPassword,
      });

      if (result.ok) {
        toast({ message: "Senha atualizada com sucesso!", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          message: result.error || "Erro ao atualizar senha",
          type: "error",
        });
      }
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-brand-text">
          Configurações
        </h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          <TabsTrigger value="company">Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-brand-text">
                  Informações Pessoais
                </h2>
                <p className="text-sm text-brand-muted">
                  Atualize sua foto e detalhes de contato
                </p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userImage || undefined} />
                  <AvatarFallback className="text-2xl bg-brand-btn-light text-brand-primary">
                    {name.charAt(0).toUpperCase() ||
                      user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <UpdateAvatarModal
                    userId={user.id}
                    currentImage={userImage}
                    onAvatarUpdate={(url) => { setUserImage(url); setContextUserImage(url); }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    E-mail
                    <span className="text-xs ml-2 text-brand-muted">
                      (altera o login)
                    </span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleProfileSave}
                  disabled={isProfilePending}
                  className="transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {isProfilePending ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator className="bg-border" />

          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-brand-text">
                  Segurança
                </h2>
                <p className="text-sm text-brand-muted">
                  Gerencie sua senha e autenticação
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  {newPassword && (
                    <div
                      className={`text-xs p-2 rounded ${
                        getPasswordStrengthMessage(newPassword).isValid
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                      }`}
                    >
                      <div className="font-medium mb-1">
                        {getPasswordStrengthMessage(newPassword).isValid
                          ? "✓ Senha forte"
                          : "Requisitos não atendidos:"}
                      </div>
                      {!getPasswordStrengthMessage(newPassword).isValid && (
                        <div className="whitespace-pre-line">
                          {getPasswordStrengthMessage(newPassword).message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={isPasswordPending}
                  className="transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {isPasswordPending ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Atualizando...
                    </>
                  ) : (
                    "Atualizar Senha"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator className="bg-border" />

          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-brand-text">
                  Preferências
                </h2>
                <p className="text-sm text-brand-muted">
                  Gerencie sua experiência na plataforma
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="darkMode" className="font-medium">
                      Tema Escuro
                    </Label>
                    <p className="text-xs text-brand-muted">
                      Ative o modo escuro da interface
                    </p>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={darkModeEnabled}
                    onCheckedChange={handleDarkModeToggle}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-brand-text">
                  Dados da Empresa
                </h2>
                <p className="text-sm text-brand-muted">
                  Informações da sua organização
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={company.name}
                    disabled
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-description">Descrição</Label>
                  <Input
                    id="company-description"
                    value={company.description || ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="bg-border" />

          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-brand-text">
                  Webhook de Revalidação
                </h2>
                <p className="text-sm text-brand-muted">
                  Quando um artigo do blog ou conteúdo de página for salvo ou
                  publicado, o Janus chamará esta URL para revalidar o cache do
                  seu site.
                </p>
              </div>

              <form action={webhookAction} className="space-y-4 max-w-md">
                <input type="hidden" name="companySlug" value={company.slug} />

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    name="webhookUrl"
                    type="url"
                    defaultValue={company.webhookUrl || ""}
                    placeholder="https://seu-site.com/api/revalidate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookToken">Token Secreto</Label>
                  <Input
                    id="webhookToken"
                    name="webhookToken"
                    type="password"
                    defaultValue={company.webhookToken || ""}
                    placeholder="Token enviado no header x-revalidate-token"
                  />
                  <p className="text-xs text-brand-muted">
                    Enviado como{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      x-revalidate-token
                    </code>{" "}
                    no header da requisição POST.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isWebhookPending}
                  className="transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {isWebhookPending ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Salvando...
                    </>
                  ) : (
                    "Salvar Webhook"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
