"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Pencil,
  Plus,
  Loader2,
  UsersRound,
  Search,
  UserCircle,
  X,
} from "lucide-react";
import { startImpersonation } from "@/modules/auth/actions/startImpersonation";
import { enterPrivilegedMode } from "@/modules/auth/actions/enterPrivilegedMode";
import { SlugInput } from "@/components/ui/SlugInput";
import { adminCreateCompany } from "@/modules/admin/actions/adminCreateCompany";
import { adminEditCompany } from "@/modules/admin/actions/adminEditCompany";
import { adminDeleteCompany } from "@/modules/admin/actions/adminDeleteCompany";
import { toggleGuestMode } from "@/modules/admin/actions/toggleGuestMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminDataTable,
  type ColumnDef,
  type FilterDef,
} from "@/components/ui/AdminDataTable";

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  guestModeEnabled: boolean;
  createdAt: Date;
  users: { id: string; name: string | null; email: string; role: string }[];
  projects: { id: string }[];
}

function CompanyFormModal({
  mode,
  company,
  onClose,
}: {
  mode: "create" | "edit";
  company?: Company;
  onClose: () => void;
}) {
  const router = useRouter();
  const action = mode === "create" ? adminCreateCompany : adminEditCompany;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await action({ ok: false }, formData);
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
            <Building2 className="w-4 h-4 text-brand-primary" />
            {mode === "create" ? "Nova Empresa" : "Editar Empresa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "edit" && (
            <input type="hidden" name="id" value={company?.id} />
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input
              name="name"
              required
              defaultValue={company?.name}
              placeholder="Acme Corp"
            />
          </div>

          <SlugInput
            name="slug"
            defaultValue={company?.slug}
            placeholder="acme-corp"
            required
            label="Slug"
          />

          <div className="flex flex-col gap-1.5">
            <Label>Descrição (opcional)</Label>
            <Input
              name="description"
              defaultValue={company?.description ?? ""}
              placeholder="Descrição da empresa"
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
              {mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GuestModeSwitch({ company }: { company: Company }) {
  const [enabled, setEnabled] = useState(company.guestModeEnabled);
  const [, startTransition] = useTransition();

  function handleToggle(value: boolean) {
    setEnabled(value);
    startTransition(async () => {
      await toggleGuestMode(company.id, value);
    });
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Switch checked={enabled} onCheckedChange={handleToggle} />
    </div>
  );
}

export function AdminCompaniesClient({
  companies,
  currentRole,
}: {
  companies: Company[];
  currentRole: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<
    | null
    | "create"
    | { mode: "edit"; company: Company }
    | { mode: "impersonate"; company: Company }
  >(null);
  const [impersonateSearch, setImpersonateSearch] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);

  const isAdmin = currentRole === "ADMIN";

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => adminDeleteCompany(id)));
    router.refresh();
  }

  async function handleCompanyClick(company: Company) {
    if (isAdmin) {
      await enterPrivilegedMode(window.location.href);
      window.location.href = `/${company.slug}/dashboard`;
    } else {
      setModal({ mode: "impersonate", company });
    }
  }

  const columns: ColumnDef<Company>[] = [
    {
      key: "name",
      label: "Empresa",
      render: (company) => (
        <button
          onClick={() => handleCompanyClick(company)}
          className="flex items-center gap-3 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text group-hover:text-brand-primary transition">
              {company.name}
            </p>
            {company.description && (
              <p className="text-xs text-brand-muted truncate max-w-[180px]">
                {company.description}
              </p>
            )}
          </div>
        </button>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      optional: true,
      render: (company) => (
        <code className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
          {company.slug}
        </code>
      ),
    },
    {
      key: "users",
      label: "Usuários",
      optional: true,
      className: "text-center",
      render: (company) => (
        <span className="text-sm text-brand-text">{company.users.length}</span>
      ),
    },
    {
      key: "projects",
      label: "Projetos",
      optional: true,
      className: "text-center",
      render: (company) => (
        <span className="text-sm text-brand-text">
          {company.projects.length}
        </span>
      ),
    },
    {
      key: "guestMode",
      label: "Convidados",
      optional: true,
      className: "text-center",
      render: (company) => <GuestModeSwitch company={company} />,
    },
  ];

  const filters: FilterDef<Company>[] = [
    {
      key: "guestMode",
      label: "Convidados",
      options: [
        { value: "", label: "Todos" },
        { value: "enabled", label: "Ativado" },
        { value: "disabled", label: "Desativado" },
      ],
      predicate: (company, value) =>
        value === "enabled"
          ? company.guestModeEnabled
          : value === "disabled"
            ? !company.guestModeEnabled
            : true,
    },
    {
      key: "activity",
      label: "Atividade",
      options: [
        { value: "", label: "Todas" },
        { value: "active", label: "Com usuários" },
        { value: "empty", label: "Sem usuários" },
      ],
      predicate: (company, value) =>
        value === "active"
          ? company.users.length > 0
          : value === "empty"
            ? company.users.length === 0
            : true,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Empresas</h1>
        <p className="text-sm text-brand-muted mt-0.5">
          {companies.length} empresa{companies.length !== 1 ? "s" : ""}{" "}
          cadastrada{companies.length !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminDataTable
        data={companies}
        columns={columns}
        getRowId={(c) => c.id}
        searchPredicate={(c, term) =>
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term) ||
          (c.description?.toLowerCase().includes(term) ?? false)
        }
        filters={filters}
        onBulkDelete={handleBulkDelete}
        bulkDeleteDescription="Esta ação excluirá permanentemente as empresas selecionadas e todos os projetos, páginas e usuários associados."
        renderRowActions={(company) => (
          <>
            <Link
              href={`/dashboard-admin/companies/${company.id}/guests`}
              className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
              title="Gerenciar convidados"
            >
              <UsersRound className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setModal({ mode: "edit", company })}
              className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        searchPlaceholder="Buscar empresas..."
        emptyIcon={
          <Building2 className="w-10 h-10 text-brand-muted opacity-40" />
        }
        emptyMessage="Nenhuma empresa cadastrada"
        newButton={
          <button
            onClick={() => setModal("create")}
            className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white hover:bg-brand-primary/90 transition shrink-0"
            title="Nova Empresa"
          >
            <Plus size={16} />
          </button>
        }
      />

      {modal === "create" && (
        <CompanyFormModal mode="create" onClose={() => setModal(null)} />
      )}
      {modal !== null && typeof modal === "object" && modal.mode === "edit" && (
        <CompanyFormModal
          mode="edit"
          company={modal.company}
          onClose={() => setModal(null)}
        />
      )}
      {modal !== null &&
        typeof modal === "object" &&
        modal.mode === "impersonate" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">
                  Acessar como usuário — {modal.company.name}
                </h2>
                <button
                  onClick={() => setModal(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={impersonateSearch}
                    onChange={(e) => setImpersonateSearch(e.target.value)}
                    placeholder="Buscar por nome ou e-mail..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {(() => {
                  const term = impersonateSearch.toLowerCase();
                  const filtered = modal.company.users.filter(
                    (u) =>
                      (u.name?.toLowerCase().includes(term) ?? false) ||
                      u.email.toLowerCase().includes(term),
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
                  return filtered.map((user) => {
                    const isPlatformAdmin = user.role === "ADMIN";
                    return (
                      <button
                        key={user.id}
                        onClick={async () => {
                          if (isPlatformAdmin) return;
                          setIsImpersonating(true);
                          const result = await startImpersonation(
                            user.id,
                            modal.company.slug,
                            window.location.href,
                          );
                          if (result.ok) {
                            window.open(
                              `/${modal.company.slug}/dashboard`,
                              "_self",
                            );
                          } else {
                            setIsImpersonating(false);
                          }
                        }}
                        disabled={isImpersonating || isPlatformAdmin}
                        className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <UserCircle className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.name || user.email}
                            </p>
                            {user.role !== "DEFAULT" && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary shrink-0">
                                {user.role === "DEVELOPER" ? "Dev" : "Admin"}
                              </span>
                            )}
                          </div>
                          {user.name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                        {isImpersonating && !isPlatformAdmin && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
