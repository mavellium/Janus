"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Loader2,
  UserCircle,
  CheckCircle2,
  Clock,
  Pencil,
  KeyRound,
  X,
  Search,
} from "lucide-react";
import { adminCreateUser } from "@/modules/admin/actions/adminCreateUser";
import { adminEditUser } from "@/modules/admin/actions/adminEditUser";
import { adminDeleteUser } from "@/modules/admin/actions/adminDeleteUser";
import { PasswordField } from "@/components/ui/password-field";
import { adminQuickCreateCompany } from "@/modules/admin/actions/adminQuickCreateCompany";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminDataTable,
  type ColumnDef,
  type FilterDef,
} from "@/components/ui/AdminDataTable";

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
  permissions: string | string[] | Record<string, Record<string, string[]>>;
  requiresPasswordReset: boolean;
  createdAt: Date;
  companyId: string | null;
  company: { id: string; name: string; slug: string } | null;
  linkedCompanyIds: string[];
}

type ModuleType = "sites" | "landingPages";

function CompanyMultiSelect({
  allCompanies,
  selectedIds,
  onChange,
}: {
  allCompanies: Company[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const unselected = allCompanies.filter((c) => !selectedIds.includes(c.id));
  const filtered =
    trimmed.length > 0
      ? unselected.filter(
          (c) =>
            c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            c.slug.toLowerCase().includes(trimmed.toLowerCase()),
        )
      : unselected.slice(0, 4);
  const exactMatch = allCompanies.some(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const showCreate = trimmed.length >= 2 && !exactMatch;
  const showDropdown = focused && (filtered.length > 0 || showCreate);

  const selected = allCompanies.filter((c) => selectedIds.includes(c.id));

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  async function handleCreate() {
    setCreating(true);
    const result = await adminQuickCreateCompany(trimmed);
    if (result.ok) {
      onChange([...selectedIds, result.company.id]);
      allCompanies.push(result.company);
      setQuery("");
    }
    setCreating(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-col gap-1">
          {selected.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-brand-btn-light/50"
            >
              <div className="w-5 h-5 rounded bg-brand-primary/15 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-brand-primary leading-none">
                  {c.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-brand-text truncate flex-1">
                {c.name}
              </span>
              {i === 0 && (
                <span className="text-[10px] font-medium text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                  principal
                </span>
              )}
              <button
                type="button"
                onClick={() => toggle(c.id)}
                className="p-0.5 rounded text-brand-muted hover:text-destructive transition shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Buscar ou criar empresa..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-input bg-transparent text-brand-text placeholder:text-brand-muted outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition"
        />
      </div>

      {showDropdown && (
        <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-card">
          {filtered.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => {
                toggle(company.id);
                setQuery("");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-brand-btn-light transition"
            >
              <div className="w-4 h-4 rounded border-2 border-border shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-brand-text truncate">
                  {company.name}
                </p>
                <p className="text-xs text-brand-muted">{company.slug}</p>
              </div>
            </button>
          ))}

          {showCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left border-t border-border hover:bg-brand-btn-light transition text-brand-primary disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Plus className="w-3.5 h-3.5 shrink-0" />
              )}
              Criar empresa &ldquo;{trimmed}&rdquo;
            </button>
          )}

          {filtered.length === 0 && !showCreate && (
            <p className="px-3 py-2 text-xs text-brand-muted">
              Nenhuma empresa encontrada
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CreateUserModal({
  companies: initialCompanies,
  onClose,
}: {
  companies: Company[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [role, setRole] = useState("DEFAULT");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.delete("linkedCompanyIds[]");
    linkedIds.forEach((id) => formData.append("linkedCompanyIds[]", id));
    formData.set("role", role);
    setError(null);
    startTransition(async () => {
      const result = await adminCreateUser({ ok: false }, formData);
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
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-brand-primary" />
            Novo Usuário
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
              placeholder="email@exemplo.com"
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

          <div className="flex flex-col gap-1.5">
            <Label>Empresas</Label>
            <CompanyMultiSelect
              allCompanies={companies}
              selectedIds={linkedIds}
              onChange={(ids) => {
                setLinkedIds(ids);
                const newCompanies = ids
                  .filter((id) => !companies.find((c) => c.id === id))
                  .map((id) => ({ id, name: id, slug: id }));
                if (newCompanies.length > 0)
                  setCompanies((prev) => [...prev, ...newCompanies]);
              }}
            />
            {linkedIds.length === 0 && (
              <p className="text-xs text-brand-muted">
                Nenhuma empresa vinculada — o usuário verá a tela &ldquo;sem
                acesso&rdquo; ao fazer login.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full h-9 border-input bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">Usuário</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
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
              Criar Usuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserModal({
  user,
  companies: initialCompanies,
  onClose,
}: {
  user: User;
  companies: Company[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);

  const initialLinked = Array.from(
    new Set([
      ...(user.companyId ? [user.companyId] : []),
      ...(user.linkedCompanyIds ?? []),
    ]),
  );
  const [linkedIds, setLinkedIds] = useState<string[]>(initialLinked);

  const primaryId = linkedIds[0] ?? null;

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.delete("linkedCompanyIds[]");
    linkedIds.forEach((id) => formData.append("linkedCompanyIds[]", id));
    formData.set("companyId", primaryId ?? "");
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
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-brand-text flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-brand-primary" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={user.id} />

          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input
              name="name"
              required
              defaultValue={user.name ?? ""}
              placeholder="Nome completo"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input
              name="email"
              type="email"
              required
              defaultValue={user.email}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Empresas</Label>
            <CompanyMultiSelect
              allCompanies={companies}
              selectedIds={linkedIds}
              onChange={(ids) => {
                setLinkedIds(ids);
                const newCompanies = ids
                  .filter((id) => !companies.find((c) => c.id === id))
                  .map((id) => ({ id, name: id, slug: id }));
                if (newCompanies.length > 0)
                  setCompanies((prev) => [...prev, ...newCompanies]);
              }}
            />
            {linkedIds.length === 0 && (
              <p className="text-xs text-brand-muted">
                Nenhuma empresa vinculada — o usuário verá a tela &ldquo;sem
                acesso&rdquo; ao fazer login.
              </p>
            )}
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

export function AdminUsersClient({
  users,
  companies,
}: {
  users: User[];
  companies: Company[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [permissionsModuleSelector, setPermissionsModuleSelector] =
    useState<User | null>(null);
  const [permissionsModal, setPermissionsModal] = useState<{
    user: User;
    module: ModuleType;
  } | null>(null);

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => adminDeleteUser(id)));
    router.refresh();
  }

  const companySlugs = useMemo(
    () => [
      ...new Set(
        users.map((u) => u.company?.slug).filter((s): s is string => Boolean(s)),
      ),
    ],
    [users],
  );

  const columns: ColumnDef<User>[] = [
    {
      key: "name",
      label: "Usuário",
      render: (user) => (
        <button
          onClick={async () => {
            if (user.role !== "DEFAULT") return;
            if (!user.company) return;
            const result = await startImpersonation(
              user.id,
              user.company.slug,
              window.location.href,
            );
            if (result.ok)
              window.location.href = `/${user.company.slug}/dashboard`;
          }}
          className={`text-left group ${user.role === "DEFAULT" ? "cursor-pointer" : "cursor-default"}`}
        >
          <p
            className={`text-sm font-medium text-brand-text ${user.role === "DEFAULT" ? "group-hover:text-brand-primary transition" : ""}`}
          >
            {user.name || "—"}
          </p>
          <p className="text-xs text-brand-muted">{user.email}</p>
        </button>
      ),
    },
    {
      key: "company",
      label: "Empresa",
      optional: true,
      render: (user) =>
        user.company ? (
          <code className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
            {user.company.slug}
          </code>
        ) : (
          <span className="text-xs text-brand-muted">—</span>
        ),
    },
    {
      key: "role",
      label: "Cargo",
      optional: true,
      render: (user) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-btn-light text-brand-text">
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      ),
    },
    {
      key: "password",
      label: "Senha",
      optional: true,
      render: (user) => (
        <div className="flex items-center gap-1.5">
          {user.requiresPasswordReset ? (
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
      render: (user) => (
        <span className="text-sm text-brand-muted">
          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  const filters: FilterDef<User>[] = [
    {
      key: "role",
      label: "Cargo",
      options: [
        { value: "", label: "Todos" },
        { value: "DEFAULT", label: "Usuário" },
        { value: "DEVELOPER", label: "Developer" },
        { value: "ADMIN", label: "Admin" },
      ],
      predicate: (user, value) => user.role === value,
    },
    {
      key: "passwordStatus",
      label: "Senha",
      options: [
        { value: "", label: "Todas" },
        { value: "reset", label: "Requer redefinição" },
        { value: "ok", label: "Normal" },
      ],
      predicate: (user, value) =>
        value === "reset"
          ? user.requiresPasswordReset
          : value === "ok"
            ? !user.requiresPasswordReset
            : true,
    },
    {
      key: "company",
      label: "Empresa",
      options: [
        { value: "", label: "Todas" },
        ...companySlugs.map((s) => ({ value: s, label: s })),
      ],
      predicate: (user, value) => user.company?.slug === value,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Usuários</h1>
        <p className="text-sm text-brand-muted mt-0.5">
          {users.length} usuário{users.length !== 1 ? "s" : ""} no sistema
        </p>
      </div>

      <AdminDataTable
        data={users}
        columns={columns}
        getRowId={(u) => u.id}
        searchPredicate={(u, term) =>
          (u.name?.toLowerCase().includes(term) ?? false) ||
          u.email.toLowerCase().includes(term) ||
          (u.company?.slug.toLowerCase().includes(term) ?? false)
        }
        filters={filters}
        onBulkDelete={handleBulkDelete}
        bulkDeleteDescription="Esta ação excluirá permanentemente os usuários selecionados e todos os dados associados."
        renderRowActions={(user) => (
          <>
            <button
              onClick={() => setEditTarget(user)}
              className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPermissionsModuleSelector(user)}
              className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
              title="Permissões"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        searchPlaceholder="Buscar usuários..."
        emptyIcon={<Users className="w-10 h-10 text-brand-muted opacity-40" />}
        emptyMessage="Nenhum usuário cadastrado"
        newButton={
          <button
            onClick={() => setShowCreate(true)}
            className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white hover:bg-brand-primary/90 transition shrink-0"
            title="Novo Usuário"
          >
            <Plus size={16} />
          </button>
        }
      />

      {showCreate && (
        <CreateUserModal
          companies={companies}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          companies={companies}
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
            setPermissionsModal({ user: permissionsModuleSelector, module });
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
    </div>
  );
}
