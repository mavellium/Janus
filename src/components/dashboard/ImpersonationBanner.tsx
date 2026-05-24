"use client";

import { useTransition, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  KeyRound,
  ArrowLeft,
  Shield,
  ChevronDown,
  UserCircle,
  Search,
} from "lucide-react";
import { stopImpersonation } from "@/modules/auth/actions/stopImpersonation";
import { startImpersonation } from "@/modules/auth/actions/startImpersonation";
import { ImpersonationSelector } from "./ImpersonationSelector";
import { UserPermissionsModal } from "./UserPermissionsModal";

interface CompanyUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Props {
  companySlug: string;
  companyId: string;
  companyName: string;
  impersonatedUserName: string | null;
  isImpersonating: boolean;
  companyUsers: CompanyUser[];
  allCompanies: Array<{ id: string; name: string; slug: string }>;
  realUserRole: "ADMIN" | "DEVELOPER";
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  impersonatedUserPermissions?:
    | string
    | string[]
    | Record<string, Record<string, string[]>>;
  returnUrl?: string | null;
  adminReturnPath: string;
}

function UserPicker({
  companySlug,
  companyUsers,
}: {
  companySlug: string;
  companyUsers: CompanyUser[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filtered = companyUsers.filter(
    (u) =>
      (u.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleSelect(user: CompanyUser) {
    setIsLoading(true);
    setOpen(false);
    const result = await startImpersonation(
      user.id,
      companySlug,
      window.location.href,
    );
    if (result.ok) {
      window.location.reload();
    } else {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setSearch("");
        }}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-foreground bg-background border border-border hover:bg-accent transition disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          <UserCircle className="w-3.5 h-3.5 shrink-0" />
        )}
        Simular usuário
        <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar usuário..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-transparent outline-none focus:border-brand-primary transition"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-brand-btn-light transition"
                >
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <UserCircle className="w-3.5 h-3.5 text-brand-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-text truncate">
                      {u.name || u.email}
                    </p>
                    {u.name && (
                      <p className="text-brand-muted truncate">{u.email}</p>
                    )}
                  </div>
                  {u.role === "DEVELOPER" && (
                    <span className="text-[10px] font-semibold text-brand-primary shrink-0">
                      Dev
                    </span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-brand-muted">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ImpersonationBanner({
  companySlug,
  companyId: _companyId,
  companyName: _companyName,
  impersonatedUserName,
  isImpersonating,
  companyUsers,
  allCompanies: _allCompanies,
  realUserRole,
  impersonatedUserId,
  impersonatedUserEmail,
  impersonatedUserPermissions,
  returnUrl,
  adminReturnPath,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [showSelector, setShowSelector] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  function handleBackToPanel() {
    startTransition(async () => {
      await stopImpersonation(false);
      window.location.href = returnUrl ?? adminReturnPath;
    });
  }

  return (
    <>
      {isImpersonating && (
        <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Simulando: <strong>{impersonatedUserName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {impersonatedUserId && (
              <button
                onClick={() => setShowPermissions(true)}
                className="p-1.5 rounded bg-destructive-foreground/20 hover:bg-destructive-foreground/30 transition"
                title="Editar permissões do usuário"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={async () => {
                await stopImpersonation(false);
                window.location.reload();
              }}
              className="p-1.5 rounded bg-destructive-foreground/20 hover:bg-destructive-foreground/30 transition"
              title="Sair da simulação — modo privilegiado"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowSelector(true)}
              className="px-3 py-1 rounded text-xs font-semibold bg-destructive-foreground/20 hover:bg-destructive-foreground/30 transition"
            >
              Trocar
            </button>
            <button
              onClick={handleBackToPanel}
              disabled={isPending}
              className="px-3 py-1 rounded text-xs font-semibold bg-destructive-foreground text-destructive hover:opacity-90 transition flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              <ArrowLeft className="w-3 h-3" />
              Voltar ao Painel
            </button>
          </div>
        </div>
      )}

      {!isImpersonating && (
        <div className="sticky top-0 z-50 w-full border-b border-border bg-muted px-4 py-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-xs text-muted-foreground font-medium">
            Modo privilegiado
          </span>
          <div className="flex items-center gap-2">
            {companyUsers.length > 0 && (
              <UserPicker
                companySlug={companySlug}
                companyUsers={companyUsers}
              />
            )}
            <a
              href={returnUrl ?? adminReturnPath}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold text-foreground bg-background border border-border hover:bg-accent transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Painel
            </a>
          </div>
        </div>
      )}

      {showSelector && (
        <ImpersonationSelector
          companySlug={companySlug}
          users={companyUsers}
          onClose={() => setShowSelector(false)}
        />
      )}

      {showPermissions && impersonatedUserId && (
        <UserPermissionsModal
          userId={impersonatedUserId}
          userEmail={impersonatedUserEmail || "Usuário"}
          initialPermissions={impersonatedUserPermissions}
          onClose={() => setShowPermissions(false)}
        />
      )}
    </>
  );
}
