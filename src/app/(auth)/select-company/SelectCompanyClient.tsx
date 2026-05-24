"use client";

import { useState } from "react";
import { Building2, ArrowRight, Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  userName: string | null;
  companies: Company[];
  primaryCompanyId: string | null;
}

export function SelectCompanyClient({
  userName,
  companies,
  primaryCompanyId,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  function handleSelect(slug: string) {
    setLoading(slug);
    window.location.href = `/${slug}/dashboard`;
  }

  return (
    <div className="w-full max-w-sm px-4">
      <div className="px-8 py-10 bg-card rounded-2xl shadow-sm border border-brand-btn-light flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-brand-text">
              Bem-vindo{userName ? `, ${userName.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-sm text-brand-muted mt-0.5">
              Selecione a empresa que deseja acessar
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {companies.map((company) => {
            const isPrimary = company.id === primaryCompanyId;
            const isLoading = loading === company.slug;
            return (
              <button
                key={company.id}
                onClick={() => handleSelect(company.slug)}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-background hover:bg-brand-btn-light hover:border-brand-primary/40 transition text-left group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
                  ) : (
                    <Building2 className="w-4 h-4 text-brand-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">
                    {company.name}
                  </p>
                  {isPrimary && (
                    <p className="text-xs text-brand-primary">Principal</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-transparent text-sm text-brand-muted hover:text-brand-text hover:bg-brand-btn-light transition disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </div>
  );
}
