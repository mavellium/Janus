"use client";

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import {
  Search,
  ListFilter,
  SlidersHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  GripVertical,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  label: string;
  optional?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: FilterOption[];
  predicate: (row: T, value: string) => boolean;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  searchPredicate: (row: T, term: string) => boolean;
  filters?: FilterDef<T>[];
  onBulkDelete?: (ids: string[]) => Promise<void>;
  bulkDeleteDescription?: string;
  renderRowActions?: (row: T) => ReactNode;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyMessage?: string;
  newButton?: ReactNode;
}

export function AdminDataTable<T,>({
  data,
  columns,
  getRowId,
  searchPredicate,
  filters,
  onBulkDelete,
  bulkDeleteDescription,
  renderRowActions,
  searchPlaceholder = "Buscar...",
  emptyIcon,
  emptyMessage = "Nenhum item encontrado",
  newButton,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.filter((c) => c.optional).map((c) => c.key),
  );
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const cancelBulkRef = useRef<HTMLButtonElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bulkDeleteModalOpen) cancelBulkRef.current?.focus();
  }, [bulkDeleteModalOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target as Node)
      ) {
        setFilterMenuOpen(false);
      }
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(e.target as Node)
      ) {
        setColumnMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    let rows = data;
    if (search.trim()) {
      const term = search.toLowerCase();
      rows = rows.filter((r) => searchPredicate(r, term));
    }
    for (const [key, value] of Object.entries(filterValues)) {
      if (!value) continue;
      const def = filters?.find((f) => f.key === key);
      if (def) rows = rows.filter((r) => def.predicate(r, value));
    }
    return rows;
  }, [data, search, filterValues, filters, searchPredicate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  const startRecord = filtered.length === 0 ? 0 : start + 1;
  const endRecord = Math.min(start + pageSize, filtered.length);

  const visibleOptionalColumns = columnOrder
    .filter((key) => !hiddenColumns.has(key))
    .map((key) => columns.find((c) => c.key === key))
    .filter((c): c is ColumnDef<T> => c !== undefined);
  const fixedColumns = columns.filter((c) => !c.optional);
  const renderedColumns = [...fixedColumns, ...visibleOptionalColumns];

  const pagedIds = paged.map(getRowId);
  const allPageSelected =
    pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));
  const somePageSelected = pagedIds.some((id) => selectedIds.has(id));

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pagedIds.forEach((id) => next.delete(id));
      } else {
        pagedIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeFilterCount = Object.values(filterValues).filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || !!search;

  function updateFilter(key: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearAllFilters() {
    setSearch("");
    setFilterValues({});
    setPage(1);
  }

  function handleDragStart(key: string) {
    setDraggingKey(key);
  }

  function handleDragOver(e: React.DragEvent, targetKey: string) {
    e.preventDefault();
    if (!draggingKey || draggingKey === targetKey) return;
    setColumnOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggingKey);
      const toIdx = next.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggingKey);
      return next;
    });
  }

  function handleDragEnd() {
    setDraggingKey(null);
  }

  async function confirmBulkDelete() {
    if (!onBulkDelete) return;
    setIsBulkDeleting(true);
    await onBulkDelete(Array.from(selectedIds));
    setIsBulkDeleting(false);
    setBulkDeleteModalOpen(false);
    setSelectedIds(new Set());
  }

  const isEmpty = data.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  const iconBtn = (active = false) =>
    `w-8 h-8 rounded-lg border flex items-center justify-center transition shrink-0 ${
      active
        ? "border-brand-primary text-brand-primary bg-brand-primary/10"
        : "border-border text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/40"
    }`;

  return (
    <div>
      <div className="bg-card border border-border rounded-xl overflow-visible">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
          {newButton}

          {/* Column visibility */}
          <div className="relative shrink-0" ref={columnMenuRef}>
            <button
              onClick={() => setColumnMenuOpen((v) => !v)}
              className={iconBtn(columnMenuOpen)}
              title="Visibilidade de colunas"
            >
              <SlidersHorizontal size={15} />
            </button>
            {columnMenuOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                {columnOrder.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-brand-muted">
                    Nenhuma coluna opcional
                  </p>
                ) : (
                  columnOrder.map((key) => {
                    const col = columns.find((c) => c.key === key);
                    if (!col) return null;
                    const isHidden = hiddenColumns.has(key);
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => handleDragStart(key)}
                        onDragOver={(e) => handleDragOver(e, key)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 px-3 py-2 text-sm cursor-grab hover:bg-brand-btn-light/30 transition select-none ${
                          draggingKey === key ? "opacity-50" : ""
                        }`}
                      >
                        <GripVertical
                          size={12}
                          className="text-brand-muted/50 flex-shrink-0"
                        />
                        <input
                          type="checkbox"
                          checked={!isHidden}
                          onChange={() => {
                            setHiddenColumns((prev) => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key);
                              else next.add(key);
                              return next;
                            });
                          }}
                          className="rounded border-border flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {col.label}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          {filters && filters.length > 0 && (
            <div className="relative shrink-0" ref={filterMenuRef}>
              <button
                onClick={() => setFilterMenuOpen((v) => !v)}
                className={`relative ${iconBtn(filterMenuOpen || activeFilterCount > 0)}`}
                title="Filtros"
              >
                <ListFilter size={15} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {filterMenuOpen && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg p-3 w-56">
                  <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-widest mb-3">
                    Filtrar por
                  </p>
                  <div className="flex flex-col gap-3">
                    {filters.map((f) => (
                      <div key={f.key} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-brand-text">
                          {f.label}
                        </label>
                        <select
                          value={filterValues[f.key] ?? ""}
                          onChange={(e) => updateFilter(f.key, e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {f.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  {(activeFilterCount > 0 || !!search) && (
                    <button
                      onClick={() => {
                        clearAllFilters();
                        setFilterMenuOpen(false);
                      }}
                      className="mt-3 w-full text-xs text-destructive hover:text-destructive/80 transition text-left"
                    >
                      Limpar todos os filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bulk delete icon - always visible */}
          {onBulkDelete && (
            <button
              onClick={() => {
                if (selectedIds.size > 0) setBulkDeleteModalOpen(true);
              }}
              disabled={isBulkDeleting}
              title={
                selectedIds.size === 0
                  ? "Selecione itens para excluir"
                  : `Excluir ${selectedIds.size} selecionado${selectedIds.size !== 1 ? "s" : ""}`
              }
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition shrink-0 ${
                selectedIds.size === 0
                  ? "border-border text-brand-muted opacity-40 cursor-not-allowed"
                  : "border-border text-brand-muted hover:border-destructive hover:text-destructive hover:bg-destructive/10"
              }`}
            >
              {isBulkDeleting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          )}

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-brand-bg border border-border rounded-lg text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Page size */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm text-brand-muted">Exibir</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
                setSelectedIds(new Set());
              }}
              className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-brand-muted">registros</span>
          </div>

          {/* Record count */}
          <span className="text-sm text-brand-muted shrink-0 whitespace-nowrap">
            {filtered.length === 0
              ? "Nenhum registro"
              : `Exibindo ${startRecord} a ${endRecord} de ${filtered.length} registros`}
          </span>

          {/* Pagination */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-brand-muted whitespace-nowrap px-0.5">
              Página {safePage} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border flex-wrap">
            {search && (
              <span className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                Busca: {search}
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="p-0.5 rounded-full hover:bg-brand-primary/20 transition"
                >
                  <X size={9} />
                </button>
              </span>
            )}
            {Object.entries(filterValues)
              .filter(([, value]) => value)
              .map(([key, value]) => {
                const def = filters?.find((f) => f.key === key);
                const opt = def?.options.find((o) => o.value === value);
                return (
                  <span
                    key={key}
                    className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                  >
                    {def?.label}: {opt?.label ?? value}
                    <button
                      onClick={() => updateFilter(key, "")}
                      className="p-0.5 rounded-full hover:bg-brand-primary/20 transition"
                    >
                      <X size={9} />
                    </button>
                  </span>
                );
              })}
            <button
              onClick={clearAllFilters}
              className="text-xs text-brand-muted hover:text-destructive transition ml-1"
            >
              Limpar todos
            </button>
          </div>
        )}

        {/* Table / empty states */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            {emptyIcon}
            <p className="text-sm text-brand-muted">{emptyMessage}</p>
          </div>
        ) : noResults ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Search size={32} className="text-brand-muted opacity-40" />
            <p className="text-sm text-brand-muted">
              Nenhum resultado encontrado
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  {onBulkDelete && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={(el) => {
                          if (el)
                            el.indeterminate =
                              somePageSelected && !allPageSelected;
                        }}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                  )}
                  {renderedColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide ${col.className ?? ""}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  {renderRowActions && (
                    <th className="px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide text-right">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((row) => {
                  const id = getRowId(row);
                  return (
                    <tr
                      key={id}
                      className="hover:bg-brand-btn-light/30 transition"
                    >
                      {onBulkDelete && (
                        <td className="w-10 px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(id)}
                            onChange={() => toggleRow(id)}
                            className="rounded border-border"
                          />
                        </td>
                      )}
                      {renderedColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-5 py-4 ${col.className ?? ""}`}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                      {renderRowActions && (
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {renderRowActions(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk delete modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-96 shadow-xl mx-4">
            <h3 className="text-base font-semibold text-brand-text mb-1">
              Excluir itens selecionados
            </h3>
            <p className="text-sm text-brand-muted mb-5">
              {bulkDeleteDescription ??
                `Tem certeza que deseja excluir ${selectedIds.size} item(s)? Esta ação não pode ser desfeita.`}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                ref={cancelBulkRef}
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-brand-text hover:bg-brand-btn-light transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition disabled:opacity-60"
              >
                {isBulkDeleting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Excluir {selectedIds.size} item
                {selectedIds.size !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
