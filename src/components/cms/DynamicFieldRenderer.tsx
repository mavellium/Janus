"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Plus, Trash2, Upload, Video } from "lucide-react";
import { IconPicker } from "./IconPicker";

interface UiConfig {
  "ui:label"?: string;
  "ui:description"?: string;
  "ui:widget"?:
    | "textarea"
    | "image"
    | "video"
    | "color"
    | "url"
    | "boolean"
    | "number"
    | "icon"
    | "hidden"
    | "text";
  "ui:group"?: string;
  "ui:color"?: string;
  "ui:size"?: "sm" | "md" | "lg" | "xl";
  "ui:placeholder"?: string;
}

function resolveUiConfig(
  uiSchema: Record<string, unknown>,
  path: string[],
): UiConfig {
  const dotPath = path.join(".");

  const wildcardPath = dotPath.replace(/\.\d+\./g, ".*.");

  const startsWithIndex = /^\d+\./.test(dotPath);
  const rootArrayPath = startsWithIndex ? "*." + path.slice(1).join(".") : null;

  const config =
    uiSchema[dotPath] ??
    (wildcardPath !== dotPath ? uiSchema[wildcardPath] : undefined) ??
    (rootArrayPath ? uiSchema[rootArrayPath] : undefined);

  return (
    typeof config === "object" && config !== null ? config : {}
  ) as UiConfig;
}

interface DynamicFieldRendererProps {
  dataKey: string;
  value: unknown;
  path: string[];
  onChange: (path: string[], value: unknown) => void;
  onOpenMediaModal: (path: string[], mediaType: "image" | "video") => void;
  uploadingPaths?: Set<string>;
  depth?: number;
  uiSchema?: Record<string, unknown>;
  inline?: boolean;
}

function inferType(key: string, value: unknown): string {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";

  const lk = key.toLowerCase();

  if (Array.isArray(value)) {
    return lk.includes("paragraph") || lk.includes("paragrafo")
      ? "paragraphs"
      : "array";
  }

  if (typeof value === "object" && value !== null) {
    return lk.includes("cta") || lk.includes("button") || lk.includes("botao")
      ? "cta"
      : "object";
  }

  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (
      lk.includes("link") ||
      lk.includes("url") ||
      lk.includes("href") ||
      lk.includes("destino")
    )
      return "url";
    if (lk.includes("color") || v.startsWith("#")) return "color";
    if (lk.includes("video") || v.endsWith(".mp4") || v.endsWith(".webm"))
      return "video";
    if (
      lk.includes("image") ||
      lk.includes("logo") ||
      lk.includes("src") ||
      lk.includes("img") ||
      lk.includes("bg") ||
      v.endsWith(".png") ||
      v.endsWith(".jpg") ||
      v.endsWith(".jpeg") ||
      v.endsWith(".avif") ||
      v.endsWith(".webp")
    )
      return "image";
    if (lk.includes("icon")) return "icon";
    if (
      value.length > 50 ||
      lk.includes("desc") ||
      lk.includes("text") ||
      lk.includes("content") ||
      lk.includes("body")
    )
      return "textarea";
  }

  return "text";
}

export function DynamicFieldRenderer({
  dataKey,
  value,
  path,
  onChange,
  onOpenMediaModal,
  uploadingPaths,
  depth = 0,
  uiSchema = {},
  inline = false,
}: DynamicFieldRendererProps) {
  const [isOpen, setIsOpen] = useState(true);
  const uiConfig = resolveUiConfig(uiSchema, path);
  const isUploading = uploadingPaths?.has(path.join(".")) ?? false;

  const accentColor = uiConfig["ui:color"];
  const accentStyle = accentColor
    ? { borderLeftColor: accentColor }
    : undefined;
  const accentClass = accentColor ? "border-l-[3px]" : "";

  const textareaHeightClass = {
    sm: "min-h-[48px]",
    md: "min-h-[80px]",
    lg: "min-h-[160px]",
    xl: "min-h-[280px]",
  }[uiConfig["ui:size"] ?? "md"];

  const placeholder = uiConfig["ui:placeholder"];

  if (uiConfig["ui:widget"] === "hidden") return null;

  const type = uiConfig["ui:widget"] ?? inferType(dataKey, value);

  if (type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(v) => onChange(path, v)}
        />
        <span className="text-xs text-brand-muted">
          {Boolean(value) ? "Ativado" : "Desativado"}
        </span>
      </div>
    );
  }

  if (type === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : 0}
        onChange={(e) => onChange(path, e.target.valueAsNumber)}
        className={`w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary ${accentClass}`}
        style={accentStyle}
      />
    );
  }

  if (type === "url") {
    return (
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(path, e.target.value)}
        className={`w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-cyan-400 font-mono placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary ${accentClass}`}
        style={accentStyle}
        placeholder={placeholder ?? "https://..."}
      />
    );
  }

  if (type === "color") {
    const str = typeof value === "string" ? value : "#000000";
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={str.startsWith("#") ? str : "#000000"}
          onChange={(e) => onChange(path, e.target.value)}
          className="w-10 h-9 p-1 rounded border border-border bg-brand-bg cursor-pointer"
        />
        <input
          type="text"
          value={str}
          onChange={(e) => onChange(path, e.target.value)}
          className="flex-1 bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text font-mono placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
          placeholder="#000000"
        />
      </div>
    );
  }

  if (type === "image") {
    const str = typeof value === "string" ? value : "";
    return (
      <div className="space-y-2">
        {str && (
          <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border bg-brand-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={str} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <button
          type="button"
          onClick={() => onOpenMediaModal(path, "image")}
          disabled={isUploading}
          className="w-full flex items-center gap-2 bg-brand-bg border border-border rounded-lg px-3 py-2 hover:bg-brand-btn-light/20 transition disabled:opacity-60"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-brand-muted border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <Upload className="w-4 h-4 text-brand-muted shrink-0" />
          )}
          <span className="text-sm text-brand-muted">
            {isUploading
              ? "Enviando..."
              : str
                ? "Trocar imagem"
                : "Adicionar imagem"}
          </span>
        </button>
        {str && (
          <input
            type="text"
            value={str}
            onChange={(e) => onChange(path, e.target.value)}
            className="w-full bg-brand-bg border border-border rounded-lg px-3 py-1.5 text-xs text-brand-muted font-mono truncate focus:outline-none"
          />
        )}
      </div>
    );
  }

  if (type === "video") {
    const str = typeof value === "string" ? value : "";
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onOpenMediaModal(path, "video")}
          disabled={isUploading}
          className="w-full flex items-center gap-2 bg-brand-bg border border-border rounded-lg px-3 py-2 hover:bg-brand-btn-light/20 transition disabled:opacity-60"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-brand-muted border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <Video className="w-4 h-4 text-brand-muted shrink-0" />
          )}
          <span className="text-sm text-brand-muted truncate">
            {isUploading
              ? "Enviando..."
              : str
                ? "Trocar vídeo"
                : "Adicionar vídeo"}
          </span>
        </button>
        {str && (
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => onChange(path, "")}
              className="px-2.5 py-1 rounded text-xs font-medium bg-destructive text-white hover:bg-destructive/80 transition"
            >
              Remover
            </button>
            <input
              type="text"
              value={str}
              readOnly
              className="flex-1 bg-brand-bg border border-border rounded-lg px-3 py-1.5 text-xs text-brand-muted font-mono truncate focus:outline-none"
            />
          </div>
        )}
      </div>
    );
  }

  if (type === "icon") {
    return (
      <IconPicker
        value={typeof value === "string" ? value : ""}
        onChange={(v) => onChange(path, v)}
      />
    );
  }

  if (type === "textarea") {
    return (
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(path, e.target.value)}
        className={`w-full ${textareaHeightClass} bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y ${accentClass}`}
        style={accentStyle}
        placeholder={placeholder ?? `${uiConfig["ui:label"] ?? dataKey}...`}
      />
    );
  }

  if (type === "paragraphs") {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <textarea
              value={typeof item === "string" ? item : JSON.stringify(item)}
              onChange={(e) => {
                const next = [...items];
                next[idx] = e.target.value;
                onChange(path, next);
              }}
              className="flex-1 min-h-[60px] bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"
              placeholder={`Parágrafo ${idx + 1}...`}
            />
            <button
              type="button"
              onClick={() =>
                onChange(
                  path,
                  items.filter((_, i) => i !== idx),
                )
              }
              className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition self-start"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange(path, [...items, ""])}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar parágrafo
        </button>
      </div>
    );
  }

  if (type === "cta") {
    const obj =
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    return (
      <div className="border border-border rounded-lg p-3 space-y-3 bg-brand-bg/40">
        {(["text", "href", "icon"] as const).map((k) => {
          const fieldUiConfig = resolveUiConfig(uiSchema, [...path, k]);
          return (
            <div key={k} className="space-y-1">
              <label className="block text-xs font-medium text-brand-muted capitalize">
                {fieldUiConfig["ui:label"] ?? k}
              </label>
              {fieldUiConfig["ui:description"] && (
                <p className="text-[10px] text-brand-muted">
                  {fieldUiConfig["ui:description"]}
                </p>
              )}
              <input
                type="text"
                value={typeof obj[k] === "string" ? (obj[k] as string) : ""}
                onChange={(e) => onChange([...path, k], e.target.value)}
                className={`w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                  k === "href" ? "text-cyan-400 font-mono" : "text-brand-text"
                }`}
                placeholder={k === "href" ? "https://..." : `${k}...`}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "array") {
    const items = Array.isArray(value) ? value : [];
    const template = items[0];

    const createItem = (): unknown => {
      if (template === undefined) return "";
      const clear = (v: unknown): unknown => {
        if (typeof v === "string") return "";
        if (typeof v === "boolean") return false;
        if (typeof v === "number") return 0;
        if (Array.isArray(v)) return v.map(clear);
        if (typeof v === "object" && v !== null)
          return Object.fromEntries(
            Object.entries(v as Record<string, unknown>).map(([k, w]) => [
              k,
              clear(w),
            ]),
          );
        return "";
      };
      return clear(structuredClone(template));
    };

    return (
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="border border-border rounded-lg p-3 bg-brand-bg/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-brand-muted">
                {uiConfig["ui:label"] ?? dataKey} {idx + 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    path,
                    items.filter((_, i) => i !== idx),
                  )
                }
                className="p-1 text-destructive hover:bg-destructive/10 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {typeof item === "object" &&
            item !== null &&
            !Array.isArray(item) ? (
              <div className="flex flex-col gap-3">
                {Object.entries(item as Record<string, unknown>).map(
                  ([k, v]) => {
                    const fieldPath = [...path, String(idx), k];
                    const fieldUiConfig = resolveUiConfig(uiSchema, fieldPath);
                    if (fieldUiConfig["ui:widget"] === "hidden") return null;
                    return (
                      <div key={k} className="space-y-1.5">
                        <label className="block text-xs font-medium text-brand-muted capitalize">
                          {fieldUiConfig["ui:label"] ?? k}
                        </label>
                        {fieldUiConfig["ui:description"] && (
                          <p className="text-[10px] text-brand-muted">
                            {fieldUiConfig["ui:description"]}
                          </p>
                        )}
                        <DynamicFieldRenderer
                          dataKey={k}
                          value={v}
                          path={fieldPath}
                          onChange={onChange}
                          onOpenMediaModal={onOpenMediaModal}
                          uploadingPaths={uploadingPaths}
                          depth={depth + 1}
                          uiSchema={uiSchema}
                        />
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <DynamicFieldRenderer
                dataKey={dataKey}
                value={item}
                path={[...path, String(idx)]}
                onChange={onChange}
                onOpenMediaModal={onOpenMediaModal}
                uploadingPaths={uploadingPaths}
                depth={depth + 1}
                uiSchema={uiSchema}
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange(path, [...items, createItem()])}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar {uiConfig["ui:label"] ?? dataKey}
        </button>
      </div>
    );
  }

  if (type === "object") {
    const obj =
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

    const renderEntries = () =>
      Object.entries(obj).map(([k, v]) => {
        const fieldPath = [...path, k];
        const fieldUiConfig = resolveUiConfig(uiSchema, fieldPath);
        if (fieldUiConfig["ui:widget"] === "hidden") return null;
        return (
          <div key={k} className="space-y-1.5">
            <label className="block text-xs font-medium text-brand-muted capitalize">
              {fieldUiConfig["ui:label"] ?? k}
            </label>
            {fieldUiConfig["ui:description"] && (
              <p className="text-[10px] text-brand-muted">
                {fieldUiConfig["ui:description"]}
              </p>
            )}
            <DynamicFieldRenderer
              dataKey={k}
              value={v}
              path={fieldPath}
              onChange={onChange}
              onOpenMediaModal={onOpenMediaModal}
              uploadingPaths={uploadingPaths}
              depth={depth + 1}
              uiSchema={uiSchema}
            />
          </div>
        );
      });

    if (inline) {
      return <div className="flex flex-col gap-3">{renderEntries()}</div>;
    }

    const groupLabel = uiConfig["ui:label"] ?? uiConfig["ui:group"] ?? dataKey;
    return (
      <div
        className={`border border-border rounded-lg overflow-hidden bg-brand-bg/40 ${accentColor ? "border-l-[3px]" : ""}`}
        style={accentColor ? { borderLeftColor: accentColor } : undefined}
      >
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-brand-btn-light/20 hover:bg-brand-btn-light/40 transition text-left"
          style={
            accentColor
              ? { borderBottom: `1px solid ${accentColor}22` }
              : undefined
          }
        >
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {groupLabel}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-brand-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="flex flex-col p-3 gap-3">{renderEntries()}</div>
        )}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(path, e.target.value)}
      className={`w-full bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary ${accentClass}`}
      style={accentStyle}
      placeholder={placeholder ?? `${uiConfig["ui:label"] ?? dataKey}...`}
    />
  );
}
