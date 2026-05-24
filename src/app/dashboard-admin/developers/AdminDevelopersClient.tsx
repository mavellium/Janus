"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Code2,
  Plus,
  Loader2,
  UserCircle,
  CheckCircle2,
  Clock,
  Pencil,
  KeyRound,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import { PasswordField } from "@/components/ui/password-field";
import { createDeveloper } from "@/modules/admin/actions/createDeveloper";
import { adminEditUser } from "@/modules/admin/actions/adminEditUser";
import { adminDeleteUser } from "@/modules/admin/actions/adminDeleteUser";
import { startImpersonation } from "@/modules/auth/actions/startImpersonation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionsModal } from "../PermissionsModal";
import { PermissionsModuleSelector } from "../PermissionsModuleSelector";
import {
  AdminDataTable,
  type ColumnDef,
  type FilterDef,
} from "@/components/ui/AdminDataTable";

interface Developer {
  id: string;
  name: string | null;
  email: string;
  role: string;
  permissions: string | string[] | Record<string, Record<string, string[]>>;
  requiresPasswordReset: boolean;
  createdAt: Date;
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

type ModuleType = "sites" | "landingPages";

function CreateDeveloperModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createDeveloper({ ok: false }, formData);
      if (!result.ok) {
        setError(result.error ?? "Erro desconhecido.");
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-brand-primary" />
            Novo Desenvolvedor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input name="name" required placeholder="Nome completo" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input
              name="email"
              type="email"
              required
              placeholder="dev@exemplo.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Senha</Label>
            <PasswordField
              name="password"
              required
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Criar Desenvolvedor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDeveloperModal({
  developer,
  onClose,
}: {
  developer: Developer;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await adminEditUser(formData);
      if (!result.ok) {
        setError(result.error ?? "Erro desconhecido.");
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-brand-primary" />
            Editar Desenvolvedor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={developer.id} />

          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input
              name="name"
              required
              defaultValue={developer.name ?? ""}
              placeholder="Nome completo"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input
              name="email"
              type="email"
              required
              defaultValue={developer.email}
              placeholder="dev@exemplo.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Nova senha (opcional)</Label>
            <PasswordField
              name="password"
              placeholder="Deixe em branco para manter"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ROLE_LABELS: Record<string, string> = {
  DEFAULT: "Usuário",
  ADMIN: "Admin",
  DEVELOPER: "Desenvolvedor",
};

export function AdminDevelopersClient({
  developers,
  companiesByDev,
  usersByCompany,
}: {
  developers: Developer[];
  companiesByDev: Map<string, Company[]>;
  usersByCompany: Map<string, User[]>;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Developer | null>(null);
  const [permissionsModuleSelector, setPermissionsModuleSelector] =
    useState<Developer | null>(null);
  const [permissionsModal, setPermissionsModal] = useState<{
    user: Developer;
    module: ModuleType;
  } | null>(null);
  const [viewTarget, setViewTarget] = useState<Developer | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [impersonateSearch, setImpersonateSearch] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => adminDeleteUser(id)));
    router.refresh();
  }

  const columns: ColumnDef<Developer>[] = [
    {
      key: "name",
      label: "Desenvolvedor",
      render: (dev) => (
        <button
          onClick={() => {
            setViewTarget(dev);
            setSelectedCompany(null);
            setImpersonateSearch("");
          }}
          className="text-left group"
        >
          <p className="text-sm font-medium text-brand-text group-hover:text-brand-primary transition">
            {dev.name || "—"}
          </p>
          <p className="text-xs text-brand-muted">{dev.email}</p>
        </button>
      ),
    },
    {
      key: "password",
      label: "Senha",
      optional: true,
      render: (dev) => (
        <div className="flex items-center gap-1.5">
          {dev.requiresPasswordReset ? (
            <>
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-600 font-medium">
                Pendente
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                Redefinida
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Criado em",
      optional: true,
      render: (dev) => (
        <span className="text-sm text-brand-muted">
          {new Date(dev.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  const filters: FilterDef<Developer>[] = [
    {
      key: "passwordStatus",
      label: "Senha",
      options: [
        { value: "", label: "Todas" },
        { value: "reset", label: "Requer redefinição" },
        { value: "ok", label: "Normal" },
      ],
      predicate: (dev, value) =>
        value === "reset"
          ? dev.requiresPasswordReset
          : value === "ok"
            ? !dev.requiresPasswordReset
            : true,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Desenvolvedores</h1>
        <p className="text-sm text-brand-muted mt-0.5">
          {developers.length} desenvolvedor
          {developers.length !== 1 ? "es" : ""} no sistema
        </p>
      </div>

      <AdminDataTable
        data={developers}
        columns={columns}
        getRowId={(d) => d.id}
        searchPredicate={(d, term) =>
          (d.name?.toLowerCase().includes(term) ?? false) ||
          d.email.toLowerCase().includes(term)
        }
        filters={filters}
        onBulkDelete={handleBulkDelete}
        bulkDeleteDescription="Esta ação excluirá permanentemente os desenvolvedores selecionados e todos os dados associados."
        renderRowActions={(dev) => (
          <>
            <button
              onClick={() => setEditTarget(dev)}
              className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPermissionsModuleSelector(dev)}
              className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
              title="Permissões"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        searchPlaceholder="Buscar desenvolvedores..."
        emptyIcon={<Code2 className="w-10 h-10 text-brand-muted opacity-40" />}
        emptyMessage="Nenhum desenvolvedor cadastrado"
        newButton={
          <button
            onClick={() => setShowCreate(true)}
            className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white hover:bg-brand-primary/90 transition shrink-0"
            title="Novo Desenvolvedor"
          >
            <Plus size={16} />
          </button>
        }
      />

      {showCreate && (
        <CreateDeveloperModal onClose={() => setShowCreate(false)} />
      )}
      {editTarget && (
        <EditDeveloperModal
          developer={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
      {permissionsModuleSelector && (
        <PermissionsModuleSelector
          userId={permissionsModuleSelector.id}
          userName={
            permissionsModuleSelector.name || permissionsModuleSelector.email
          }
          open
          onClose={() => setPermissionsModuleSelector(null)}
          onSelectModule={(module) => {
            setPermissionsModuleSelector(null);
            setPermissionsModal({
              user: permissionsModuleSelector,
              module,
            });
          }}
        />
      )}
      {permissionsModal && (
        <PermissionsModal
          userId={permissionsModal.user.id}
          userName={permissionsModal.user.name || permissionsModal.user.email}
          initialPermissions={permissionsModal.user.permissions}
          module={permissionsModal.module}
          onBack={() => {
            const user = permissionsModal.user;
            setPermissionsModal(null);
            setPermissionsModuleSelector(user);
          }}
          onClose={() => setPermissionsModal(null)}
        />
      )}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                {!selectedCompany
                  ? `Escolher empresa — ${viewTarget.name || viewTarget.email}`
                  : `Escolher usuário — ${selectedCompany.name}`}
              </h2>
              <button
                onClick={() => {
                  if (selectedCompany) {
                    setSelectedCompany(null);
                    setImpersonateSearch("");
                  } else {
                    setViewTarget(null);
                    setImpersonateSearch("");
                  }
                }}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
              >
                {selectedCompany ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="px-5 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={impersonateSearch}
                  onChange={(e) => setImpersonateSearch(e.target.value)}
                  placeholder={
                    !selectedCompany ? "Buscar empresa..." : "Buscar usuário..."
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {!selectedCompany &&
                (() => {
                  const companies = companiesByDev.get(viewTarget.id) ?? [];
                  const term = impersonateSearch.toLowerCase();
                  const filtered = companies.filter(
                    (c) =>
                      c.name.toLowerCase().includes(term) ||
                      c.slug.toLowerCase().includes(term),
                  );
                  if (filtered.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Code2 className="w-8 h-8 text-muted-foreground opacity-40" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma empresa encontrada
                        </p>
                      </div>
                    );
                  }
                  return filtered.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => {
                        setSelectedCompany(company);
                        setImpersonateSearch("");
                      }}
                      className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-accent transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Code2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {company.name}
                        </p>
                        <code className="text-xs text-muted-foreground">
                          {company.slug}
                        </code>
                      </div>
                    </button>
                  ));
                })()}

              {selectedCompany &&
                (() => {
                  const users = usersByCompany.get(selectedCompany.id) ?? [];
                  const term = impersonateSearch.toLowerCase();
                  const filtered = users.filter(
                    (u) =>
                      (u.name?.toLowerCase().includes(term) ?? false) ||
                      u.email.toLowerCase().includes(term) ||
                      (ROLE_LABELS[u.role] ?? u.role)
                        .toLowerCase()
                        .includes(term),
                  );
                  if (filtered.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <UserCircle className="w-8 h-8 text-muted-foreground opacity-40" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum usuário encontrado
                        </p>
                      </div>
                    );
                  }
                  return filtered.map((user) => (
                    <button
                      key={user.id}
                      onClick={async () => {
                        setIsImpersonating(true);
                        const result = await startImpersonation(
                          user.id,
                          selectedCompany.slug,
                          window.location.href,
                        );
                        if (result.ok) {
                          window.open(
                            `/${selectedCompany.slug}/dashboard`,
                            "_self",
                          );
                        } else {
                          setIsImpersonating(false);
                        }
                      }}
                      disabled={isImpersonating}
                      className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-accent transition disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name || user.email}
                        </p>
                        {user.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                      {isImpersonating && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                      )}
                    </button>
                  ));
                })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
