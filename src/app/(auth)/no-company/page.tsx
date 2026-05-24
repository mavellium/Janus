"use client";

import { Building2, Mail, ArrowLeft, ShieldAlert } from "lucide-react";
import { signOut } from "next-auth/react";

export default function NoCompanyPage() {
  return (
    <div className="w-full max-w-sm px-4">
      <div className="px-8 py-10 bg-card rounded-2xl shadow-sm border border-brand-btn-light flex flex-col items-center text-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-brand-primary" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-yellow-500/15 border-2 border-card flex items-center justify-center">
            <ShieldAlert className="w-3 h-3 text-yellow-500" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold text-brand-text">
            Nenhuma empresa vinculada
          </h1>
          <p className="text-sm text-brand-muted leading-relaxed">
            Sua conta está ativa, mas ainda não foi associada a nenhuma empresa.
            Aguarde o administrador configurar seu acesso.
          </p>
        </div>

        <div className="w-full flex items-start gap-3 bg-brand-btn-light/60 border border-border rounded-xl px-4 py-3.5 text-left">
          <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-3.5 h-3.5 text-brand-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-brand-text">O que fazer?</p>
            <p className="text-xs text-brand-muted leading-relaxed">
              Informe ao administrador o e-mail da sua conta e peça para ser
              adicionado a uma empresa.
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-brand-text hover:bg-brand-btn-light hover:border-brand-primary/30 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o login
        </button>
      </div>
    </div>
  );
}
