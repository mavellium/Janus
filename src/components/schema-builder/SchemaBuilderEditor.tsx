"use client";

import {
  useEffect,
  useState,
  useTransition,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  Eye,
  Trash2,
  LayoutTemplate,
  ListChecks,
  PlaySquare,
  FileText,
  FormInput,
  GalleryHorizontalEnd,
  Search,
  Sliders,
  Library,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Code2,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { updatePageSchema } from "@/modules/projects/actions/updatePageSchema";
import { updatePageMode } from "@/modules/projects/actions/updatePageMode";
import { updatePageContentData } from "@/modules/projects/actions/updatePageContentData";
import { updatePageAdvancedData } from "@/modules/projects/actions/updatePageAdvancedData";
import { LiveFormPreview } from "./LiveFormPreview";
import { PublishPageButton } from "@/components/projects/PublishPageButton";
import { AdvancedJsonEditor } from "@/components/cms/AdvancedJsonEditor";
import { DynamicFieldRenderer } from "@/components/cms/DynamicFieldRenderer";
import { MediaUploadModal } from "./MediaUploadModal";
import { uploadMedia } from "@/modules/upload/actions/uploadMedia";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-card text-brand-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    ),
  },
);

interface SchemaField {
  name: string;
  label?: string;
  type: string;
  options?: { label: string; value: string }[];
}

interface SchemaSection {
  id: string;
  name: string;
  fields: SchemaField[];
}

interface SchemaBuilderEditorProps {
  pageId: string;
  pageName: string;
  backHref: string;
  initialSchema: unknown;
  initialContentData?: unknown;
  initialIsAdvanced?: boolean;
  initialUiSchema?: unknown;
  apiUrl: string;
  initialPublished: boolean;
  previewHref: string;
  projectId?: string;
  initialCmsEnabled?: boolean;
  initialCmsSyncScriptUrl?: string | null;
  sitePreviewUrl?: string | null;
  canViewEndpoint?: boolean;
}

const DEFAULT_SCHEMA: SchemaSection[] = [
  {
    id: "hero",
    name: "Hero Section",
    fields: [{ name: "title", label: "Título", type: "text" }],
  },
];

function isNestedUiSchema(schema: Record<string, unknown>): boolean {
  const keys = Object.keys(schema);
  if (keys.length === 0) return false;
  return !keys.some((k) => k.includes(".") || k.startsWith("ui:"));
}

function processNode(
  node: Record<string, unknown>,
  flatPrefix: string,
  sectionPrefix: string,
  flat: Record<string, unknown>,
) {
  const directConfig: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("ui:")) directConfig[k] = v;
  }
  if (Object.keys(directConfig).length > 0) flat[flatPrefix] = directConfig;

  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("ui:")) continue;
    if (typeof v !== "object" || v === null) continue;
    if (k.includes("*") || k.includes(".")) {
      flat[`${sectionPrefix}.${k}`] = v;
    } else {
      processNode(
        v as Record<string, unknown>,
        `${flatPrefix}.${k}`,
        sectionPrefix,
        flat,
      );
    }
  }
}

function normalizeNestedUiSchema(
  nested: Record<string, unknown>,
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const [sectionKey, sectionVal] of Object.entries(nested)) {
    if (typeof sectionVal !== "object" || sectionVal === null) continue;
    processNode(
      sectionVal as Record<string, unknown>,
      sectionKey,
      sectionKey,
      flat,
    );
  }
  return flat;
}

function getDeep(obj: Record<string, unknown>, path: string[]): unknown {
  let curr: unknown = obj;
  for (const key of path) {
    if (curr === null || typeof curr !== "object") return undefined;
    curr = (curr as Record<string, unknown>)[key];
  }
  return curr;
}

function setDeep(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): Record<string, unknown> {
  const clone = structuredClone(obj) as Record<string, unknown>;
  let curr: unknown = clone;
  for (let i = 0; i < path.length - 1; i++) {
    curr = Array.isArray(curr)
      ? (curr as unknown[])[Number(path[i])]
      : (curr as Record<string, unknown>)[path[i]];
  }
  const last = path[path.length - 1];
  if (Array.isArray(curr)) {
    (curr as unknown[])[Number(last)] = value;
  } else {
    (curr as Record<string, unknown>)[last] = value;
  }
  return clone;
}

function getSectionLabel(
  key: string,
  uiSchema: Record<string, unknown>,
): string {
  const config = uiSchema[key];
  if (typeof config === "object" && config !== null) {
    const label = (config as Record<string, unknown>)["ui:label"];
    if (typeof label === "string") return label;
  }
  return key;
}

const SNIPPETS = [
  {
    id: "hero",
    label: "Hero",
    description: "Seção principal com chamada para ação e imagem de fundo",
    icon: LayoutTemplate,
    value: {
      id: "hero",
      name: "Hero Section",
      fields: [
        { name: "title", label: "Título", type: "text" },
        { name: "subtitle", label: "Subtítulo", type: "textarea" },
        { name: "backgroundImage", label: "Imagem de Fundo", type: "image" },
        { name: "backgroundVideo", label: "Vídeo de Fundo", type: "video" },
        { name: "buttonText", label: "Texto do Botão", type: "text" },
        { name: "buttonLink", label: "Link do Botão", type: "url" },
        { name: "buttonColor", label: "Cor do Botão", type: "color" },
        { name: "showOverlay", label: "Mostrar Overlay", type: "boolean" },
        {
          name: "overlayOpacity",
          label: "Opacidade do Overlay",
          type: "number",
        },
        {
          name: "alignment",
          label: "Alinhamento",
          type: "select",
          options: [
            { label: "Esquerda", value: "left" },
            { label: "Centro", value: "center" },
            { label: "Direita", value: "right" },
          ],
        },
        { name: "customHtml", label: "HTML Customizado", type: "html" },
      ],
    },
  },
  {
    id: "features",
    label: "Features Grid",
    description: "Grade de recursos e diferenciais do produto",
    icon: ListChecks,
    value: {
      id: "features",
      name: "Features Grid",
      fields: [
        { name: "title", label: "Título", type: "text" },
        { name: "items", label: "Lista de Items", type: "textarea" },
      ],
    },
  },
  {
    id: "video",
    label: "Vídeo",
    description: "Seção com player de vídeo embutido",
    icon: PlaySquare,
    value: {
      id: "video",
      name: "Vídeo",
      fields: [
        { name: "title", label: "Título", type: "text" },
        { name: "videoUrl", label: "Vídeo", type: "video" },
      ],
    },
  },
  {
    id: "rich-text",
    label: "Texto Rico (HTML)",
    description: "Área para edição de texto formatado",
    icon: FileText,
    value: {
      id: "rich-text",
      name: "Texto Rico",
      fields: [{ name: "content", label: "Conteúdo HTML", type: "html" }],
    },
  },
  {
    id: "form",
    label: "Formulário",
    description: "Formulário de captação de leads",
    icon: FormInput,
    value: {
      id: "form",
      name: "Formulário",
      fields: [
        { name: "formTitle", label: "Título do Formulário", type: "text" },
        { name: "receiveEmail", label: "E-mail de Recebimento", type: "text" },
        { name: "buttonText", label: "Texto do Botão", type: "text" },
      ],
    },
  },
  {
    id: "carousel",
    label: "Carrossel",
    description: "Slides de imagens e banners (quantos quiser)",
    icon: GalleryHorizontalEnd,
    value: {
      id: "carousel",
      name: "Carrossel",
      fields: [
        {
          name: "slides",
          label: "Slide",
          type: "list",
          itemFields: [
            { name: "image", label: "Imagem", type: "image" },
            { name: "caption", label: "Legenda", type: "text" },
          ],
        },
        { name: "autoplay", label: "Autoplay", type: "boolean" },
        { name: "interval", label: "Intervalo (ms)", type: "number" },
      ],
    },
  },
  {
    id: "seo",
    label: "SEO Meta",
    description: "Metadados para SEO e redes sociais",
    icon: Search,
    value: {
      id: "seo",
      name: "SEO Meta",
      fields: [
        { name: "metaTitle", label: "Meta Title", type: "text" },
        {
          name: "metaDescription",
          label: "Meta Description",
          type: "textarea",
        },
        { name: "ogImage", label: "Open Graph Image", type: "image" },
      ],
    },
  },
  {
    id: "advanced",
    label: "Componentes Avançados",
    description: "Campos de tipos avançados: number, color, boolean, select",
    icon: Sliders,
    value: {
      id: "advanced",
      name: "Componentes Avançados",
      fields: [
        { name: "quantity", label: "Quantidade", type: "number" },
        { name: "primaryColor", label: "Cor Principal", type: "color" },
        { name: "isVisible", label: "Visível", type: "boolean" },
        {
          name: "layout",
          label: "Layout",
          type: "select",
          options: [
            { label: "Coluna Única", value: "single" },
            { label: "Duas Colunas", value: "two-col" },
            { label: "Grade 3x3", value: "grid-3" },
          ],
        },
      ],
    },
  },
];

function tryParseSchema(val: string): SchemaSection[] | null {
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed as SchemaSection[];
    if (parsed && typeof parsed === "object") return [];
    return null;
  } catch {
    return null;
  }
}

function getInitialString(initialSchema: unknown): string {
  if (Array.isArray(initialSchema) && initialSchema.length > 0) {
    return JSON.stringify(initialSchema, null, 2);
  }
  return JSON.stringify(DEFAULT_SCHEMA, null, 2);
}

function uniqueSuffix(): string {
  return Math.random().toString(36).substring(2, 7);
}

export function SchemaBuilderEditor({
  pageId,
  pageName,
  backHref,
  initialSchema,
  initialContentData,
  initialIsAdvanced = false,
  initialUiSchema,
  apiUrl,
  initialPublished,
  previewHref,
  projectId,
  initialCmsEnabled = false,
  initialCmsSyncScriptUrl,
  sitePreviewUrl,
  canViewEndpoint = false,
}: SchemaBuilderEditorProps) {
  const initialString = getInitialString(initialSchema);
  const editorRef = useRef<unknown>(null);
  const contentDataObj =
    typeof initialContentData === "object" &&
    initialContentData !== null &&
    !Array.isArray(initialContentData)
      ? (initialContentData as Record<string, unknown>)
      : {};
  const uiSchemaObj =
    typeof initialUiSchema === "object" &&
    initialUiSchema !== null &&
    !Array.isArray(initialUiSchema)
      ? (initialUiSchema as Record<string, unknown>)
      : {};
  const contentDataRef = useRef<Record<string, unknown>>(contentDataObj);
  const advancedSchemaRef = useRef<Record<string, unknown>>(
    (initialSchema as Record<string, unknown>) || {},
  );
  const uiSchemaRef = useRef<Record<string, unknown>>(uiSchemaObj);

  const [editorValue, setEditorValue] = useState<string>(initialString);
  const [validSchema, setValidSchema] = useState<SchemaSection[]>(
    () => tryParseSchema(initialString) ?? DEFAULT_SCHEMA,
  );
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] =
    useState<boolean>(initialIsAdvanced);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [uploadingPaths, setUploadingPaths] = useState<Set<string>>(new Set());
  const [mediaModal, setMediaModal] = useState<{
    open: boolean;
    path: string[];
    mediaType: "image" | "video";
  }>({ open: false, path: [], mediaType: "image" });
  const [uiSchemaState, setUiSchemaState] =
    useState<Record<string, unknown>>(uiSchemaObj);
  const effectiveUiSchema = useMemo(
    () =>
      isNestedUiSchema(uiSchemaState)
        ? normalizeNestedUiSchema(uiSchemaState)
        : uiSchemaState,
    [uiSchemaState],
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cmsModalOpen, setCmsModalOpen] = useState(false);
  const [visualMode, setVisualMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [cmsSyncScriptUrl, setCmsSyncScriptUrl] = useState<string | null>(
    initialCmsSyncScriptUrl ?? null,
  );
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptFeedback, setScriptFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const mediaModalPathRef = useRef<string[]>([]);

  const initialAdvancedData =
    typeof (initialSchema as unknown) === "object" &&
    initialSchema !== null &&
    !Array.isArray(initialSchema)
      ? (initialSchema as Record<string, unknown>)
      : {};
  const [localData, setLocalData] =
    useState<Record<string, unknown>>(initialAdvancedData);
  const localDataRef = useRef<Record<string, unknown>>(initialAdvancedData);

  const uiSchemaSections = Object.keys(effectiveUiSchema).filter((key) => {
    const config = effectiveUiSchema[key];
    if (typeof config !== "object" || config === null) return false;
    if (!(config as Record<string, unknown>)["ui:label"]) return false;
    if (key.includes("*")) return false;
    return !Object.keys(effectiveUiSchema).some(
      (other) =>
        other !== key &&
        key.startsWith(other + ".") &&
        typeof effectiveUiSchema[other] === "object" &&
        (effectiveUiSchema[other] as Record<string, unknown>)?.["ui:label"],
    );
  });
  const sections =
    uiSchemaSections.length > 0 ? uiSchemaSections : Object.keys(localData);

  const handleFieldChange = useCallback((path: string[], value: unknown) => {
    setLocalData((prev) => {
      const updated = setDeep(prev, path, value);
      localDataRef.current = updated;
      advancedSchemaRef.current = updated;
      setHasUnsavedChanges(true);
      return updated;
    });
  }, []);

  const handleOpenMediaModal = useCallback(
    (path: string[], mediaType: "image" | "video") => {
      mediaModalPathRef.current = path;
      setMediaModal({ open: true, path, mediaType });
    },
    [setMediaModal],
  );

  const handleMediaUrlSubmit = useCallback(
    (url: string) => {
      handleFieldChange(mediaModalPathRef.current, url);
      setMediaModal((prev) => ({ ...prev, open: false }));
    },
    [handleFieldChange, setMediaModal],
  );

  const handleMediaFileUpload = useCallback(
    async (file: File) => {
      const path = [...mediaModalPathRef.current];
      const pathKey = path.join(".");
      setMediaModal((prev) => ({ ...prev, open: false }));
      setUploadingPaths((prev) => new Set([...prev, pathKey]));
      const result = await uploadMedia({ file, folder: "media" });
      setUploadingPaths((prev) => {
        const n = new Set(prev);
        n.delete(pathKey);
        return n;
      });
      if (result.ok && result.url) {
        handleFieldChange(path, result.url);
      }
    },
    [handleFieldChange, setMediaModal],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!visualMode) return;
    function handleMessage(e: MessageEvent) {
      if (!e.data || e.data.type !== "CMS_ELEMENT_CLICK") return;
      const sectionKey = e.data.section as string | null;
      const fieldKey = e.data.field as string | null;
      if (!sectionKey) return;
      const uiKey = sections.find((k) => getSectionKey(k) === sectionKey) ?? (sections.includes(sectionKey) ? sectionKey : null);
      if (uiKey) {
        setSelectedSection(uiKey);
        sendIframeSection(uiKey);
        if (fieldKey) {
          setTimeout(() => {
            const el = document.querySelector<HTMLElement>(`[data-field-path="${fieldKey}"]`);
            if (!el) return;
            el.focus();
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 80);
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualMode, sections, effectiveUiSchema]);

  function handleEditorChange(val: string | undefined) {
    const str = val ?? "";
    setEditorValue(str);
    const parsed = tryParseSchema(str);
    if (parsed !== null) {
      setValidSchema(parsed);
      setIsJsonValid(true);
    } else {
      setIsJsonValid(false);
    }
  }

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updatePageSchema({
        pageId,
        schemaJson: editorValue,
      });
      if (result.ok) {
        setFeedback({ type: "success", message: "Schema salvo" });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Erro ao salvar",
        });
      }
    });
  }

  function handleSaveContent() {
    setFeedback(null);
    startTransition(async () => {
      if (isAdvancedMode) {
        const schemaJson = JSON.stringify(advancedSchemaRef.current);
        const uiSchemaJson = JSON.stringify(uiSchemaRef.current);
        const result = await updatePageAdvancedData({
          pageId,
          schemaJson,
          uiSchemaJson,
        });
        if (result.ok) {
          setFeedback({ type: "success", message: "Schema salvo" });
          setHasUnsavedChanges(false);
          setTimeout(() => setFeedback(null), 3000);
        } else {
          setFeedback({
            type: "error",
            message: result.error ?? "Erro ao salvar",
          });
        }
      } else {
        const result = await updatePageContentData({
          pageId,
          contentData: contentDataRef.current,
        });
        if (result.ok) {
          setFeedback({ type: "success", message: "Conteúdo salvo" });
          setHasUnsavedChanges(false);
          setTimeout(() => setFeedback(null), 3000);
        } else {
          setFeedback({
            type: "error",
            message: result.error ?? "Erro ao salvar",
          });
        }
      }
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(apiUrl);
    setFeedback({ type: "success", message: "URL copiada" });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleDeleteSection(sectionId: string) {
    const editor = editorRef.current as {
      getValue: () => string;
      setValue: (v: string) => void;
    } | null;
    const current = editor?.getValue() ?? "";
    const parsed = tryParseSchema(current);
    if (!parsed) return;
    const filtered = parsed.filter((s) => s.id !== sectionId);
    editor?.setValue(JSON.stringify(filtered, null, 2));
  }

  function handleFocusSection(sectionId: string) {
    setFocusedSectionId(sectionId);
    document
      .getElementById(`section-${sectionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setFocusedSectionId(null), 1000);
  }

  function getSectionKey(uiKey: string): string {
    const config = effectiveUiSchema[uiKey];
    if (typeof config === "object" && config !== null) {
      const sk = (config as Record<string, unknown>)["ui:sectionKey"];
      if (typeof sk === "string" && sk) return sk;
    }
    return uiKey;
  }

  function sendIframeSection(uiKey: string) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "CMS_SELECT_SECTION", section: getSectionKey(uiKey) },
      "*",
    );
  }

  function handleFocusField(path: string[]) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "CMS_SELECT_FIELD", field: path.join(".") },
      "*",
    );
  }

  async function handleGenerateScript() {
    if (!projectId) return;
    setIsGeneratingScript(true);
    setScriptFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-script`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        ok: boolean;
        url?: string;
        error?: string;
      };
      if (data.ok && data.url) {
        setCmsSyncScriptUrl(data.url);
        setScriptFeedback({
          type: "success",
          message: "Script gerado com sucesso!",
        });
      } else {
        setScriptFeedback({
          type: "error",
          message: data.error ?? "Erro ao gerar script",
        });
      }
    } catch {
      setScriptFeedback({ type: "error", message: "Erro de conexão" });
    } finally {
      setIsGeneratingScript(false);
      setTimeout(() => setScriptFeedback(null), 4000);
    }
  }

  function handleCopyScriptTag() {
    if (!cmsSyncScriptUrl) return;
    navigator.clipboard.writeText(
      `<script src="${cmsSyncScriptUrl}" defer></script>`,
    );
    setScriptFeedback({ type: "success", message: "Tag copiada!" });
    setTimeout(() => setScriptFeedback(null), 3000);
  }

  function insertSnippet(snippet: SchemaSection) {
    const editor = editorRef.current as {
      getValue: () => string;
      setValue: (v: string) => void;
    } | null;
    const current = editor?.getValue() ?? "";
    const parsed = tryParseSchema(current);
    const arr = Array.isArray(parsed) ? parsed : [];
    const newSection = {
      ...snippet,
      id: `${snippet.id}-${uniqueSuffix()}`,
      fields: [
        { name: "active", label: "Ativo", type: "boolean" },
        ...(snippet.fields || []),
      ],
    };
    const next = JSON.stringify([...arr, newSection], null, 2);
    editor?.setValue(next);
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-1.5 px-3 sm:px-3 py-1.5 sm:py-2 border-b border-border bg-card shrink-0 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={backHref}
            className="flex items-center gap-0.5 text-xs text-brand-muted hover:text-brand-text transition shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="min-w-0">
            <p className="text-[10px] text-brand-muted">Construir</p>
            <h1 className="text-xs font-semibold text-brand-text truncate">
              {pageName}
            </h1>
          </div>
          {!isJsonValid && (
            <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20 shrink-0">
              <AlertCircle className="w-3 h-3" />
              JSON Inválido
            </span>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {initialCmsEnabled && projectId && sitePreviewUrl && isAdvancedMode && (
            <button
              type="button"
              onClick={() => setVisualMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                visualMode
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10"
              }`}
            >
              <Monitor className="w-4 h-4" />
              {visualMode ? "Editor" : "Visual"}
            </button>
          )}
          {initialCmsEnabled && projectId && (
            <button
              type="button"
              onClick={() => setCmsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 transition"
            >
              <Code2 className="w-4 h-4" />
              Integração
            </button>
          )}
          <label className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border text-xs font-medium text-brand-text cursor-pointer select-none">
            <span>Modo Avançado (JSON Livre)</span>
            <Switch
              checked={isAdvancedMode}
              onCheckedChange={(val) => {
                setIsAdvancedMode(val);
                updatePageMode({ pageId, isAdvanced: val });
              }}
              aria-label="Alternar modo avançado JSON livre"
            />
          </label>
          {feedback && (
            <span
              className={`flex items-center gap-1.5 text-xs shrink-0 ${
                feedback.type === "success"
                  ? "text-brand-primary"
                  : "text-destructive"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {feedback.message}
            </span>
          )}
          <PublishPageButton
            pageId={pageId}
            initialPublished={initialPublished}
          />
          {isAdvancedMode ? (
            <button
              onClick={handleSaveContent}
              disabled={isPending || !hasUnsavedChanges}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-primary text-white hover:bg-brand-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isPending || !isJsonValid}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-primary text-white hover:bg-brand-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isPending ? "Salvando..." : "Salvar Schema"}
            </button>
          )}
          <Link
            href={previewHref}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-brand-text hover:bg-brand-btn-light/40 transition"
          >
            <Monitor className="w-4 h-4" />
            Visualizar
          </Link>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-y-auto">
        {!isAdvancedMode && (
          <aside className="w-full lg:w-64 shrink-0 bg-sidebar-bg border-b lg:border-b-0 lg:border-r border-border flex flex-col overflow-y-auto">
            <Tabs
              defaultValue="structure"
              className="flex flex-col flex-1 min-h-0"
            >
              <TabsList className="w-full rounded-none border-b border-border bg-sidebar-bg h-10 p-0 gap-0">
                <TabsTrigger
                  value="structure"
                  className="flex-1 h-full rounded-none text-xs border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  Estrutura
                </TabsTrigger>
                <TabsTrigger
                  value="library"
                  className="flex-1 h-full rounded-none text-xs border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Library className="w-3.5 h-3.5 mr-1.5" />
                  Componentes
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="structure"
                className="flex-1 overflow-y-auto m-0 mt-0 py-1 data-[state=inactive]:hidden"
              >
                {validSchema.length === 0 ? (
                  <p className="text-xs text-brand-muted px-4 py-3">
                    Nenhuma seção ativa.
                  </p>
                ) : (
                  validSchema.map((section, idx) => (
                    <div
                      key={section.id ?? idx}
                      onClick={() => handleFocusSection(section.id)}
                      className="group flex items-center gap-2 px-3 py-2.5 hover:bg-sidebar-hover-bg transition cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-text truncate">
                          {section.name}
                        </p>
                        <p className="text-xs text-brand-muted mt-0.5">
                          {Array.isArray(section.fields)
                            ? section.fields.length
                            : 0}{" "}
                          campo
                          {Array.isArray(section.fields) &&
                          section.fields.length !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                      {canViewEndpoint && section.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(
                              `${apiUrl}/sections/${encodeURIComponent(String(section.id))}`,
                            );
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 text-brand-muted hover:bg-brand-btn-light hover:text-brand-text transition shrink-0"
                          title="Copiar endpoint da seção"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section.id);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition shrink-0"
                        title="Remover seção"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent
                value="library"
                className="flex-1 overflow-y-auto m-0 mt-0 p-2 space-y-1 data-[state=inactive]:hidden"
              >
                {SNIPPETS.map((snippet) => {
                  const Icon = snippet.icon;
                  return (
                    <button
                      key={snippet.id}
                      onClick={() =>
                        insertSnippet(snippet.value as SchemaSection)
                      }
                      className="flex gap-3 items-start p-3 w-full text-left hover:bg-sidebar-hover-bg cursor-pointer border border-transparent hover:border-border rounded-md transition"
                    >
                      <Icon className="w-4 h-4 text-brand-muted mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-brand-text">
                          {snippet.label}
                        </p>
                        <p className="text-[10px] text-brand-muted mt-0.5 leading-relaxed">
                          {snippet.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </TabsContent>
            </Tabs>
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-brand-bg">
          {canViewEndpoint && (
            <div className="px-4 py-2 border-b border-border bg-card shrink-0 flex items-center gap-3">
              <span className="text-xs font-semibold text-brand-muted whitespace-nowrap">
                Endpoint da página:
              </span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  readOnly
                  value={apiUrl}
                  className="flex-1 bg-brand-bg border border-border rounded px-2.5 py-1 text-xs text-brand-text font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-brand-btn-light rounded text-brand-muted hover:text-brand-text transition shrink-0"
                  title="Copiar URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {isAdvancedMode && visualMode && sitePreviewUrl ? (
            <div className="flex-1 min-h-0 overflow-hidden bg-zinc-950 flex items-stretch">
              <iframe
                ref={iframeRef}
                src={sitePreviewUrl}
                className="flex-1 border-0"
                title="Preview do site"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          ) : isAdvancedMode ? (
            <div className="flex-1 min-h-0 overflow-hidden">
              <AdvancedJsonEditor
                pageId={pageId}
                data={localData}
                initialUiSchema={uiSchemaState}
                isDevMode={true}
                showFormPanel={false}
                onDataChange={(d) => {
                  advancedSchemaRef.current = d;
                  setLocalData(d);
                  setHasUnsavedChanges(true);
                }}
                onUiSchemaChange={(d) => {
                  uiSchemaRef.current = d;
                  setUiSchemaState(d);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                language="json"
                defaultValue={initialString}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                onChange={handleEditorChange}
                theme={isDark ? "vs-dark" : "light"}
                options={{
                  minimap: { enabled: false },
                  formatOnPaste: true,
                  formatOnType: true,
                  tabSize: 2,
                  insertSpaces: true,
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  renderLineHighlight: "all",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>
          )}
        </div>

        {!isAdvancedMode && (
          <aside className="w-full lg:w-80 shrink-0 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col overflow-y-auto">
            <div className="px-4 py-3 border-b border-border shrink-0 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-brand-muted" />
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                Preview do Formulário
              </span>
            </div>
            <LiveFormPreview
              sections={validSchema}
              focusedSectionId={focusedSectionId}
            />
          </aside>
        )}

        {hasUnsavedChanges && isAdvancedMode && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-sm text-amber-700 dark:text-amber-300 z-40 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium">Alterações não salvas</span>
          </div>
        )}

        {isAdvancedMode && (
          <>
            <aside className="w-full lg:w-80 shrink-0 bg-sidebar-bg border-t lg:border-t-0 lg:border-l border-border flex flex-col overflow-y-auto">
              <div className="px-4 py-3 border-b border-border shrink-0 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-brand-muted" />
                <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Seções
                </span>
              </div>
              <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {sections.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedSection(key);
                      sendIframeSection(key);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      selectedSection === key
                        ? "bg-brand-primary text-white shadow-sm"
                        : "text-brand-text bg-transparent hover:bg-brand-btn-light/40"
                    }`}
                  >
                    {getSectionLabel(key, effectiveUiSchema)}
                  </button>
                ))}
              </nav>
            </aside>

            <aside className="w-full lg:w-80 shrink-0 bg-sidebar-bg border-t lg:border-t-0 lg:border-l border-border flex flex-col overflow-y-auto">
              {selectedSection === null ? (
                <div className="flex-1 flex items-center justify-center gap-3 text-brand-muted px-6">
                  <div className="flex flex-col items-center gap-3">
                    <MousePointerClick className="w-10 h-10 opacity-30" />
                    <p className="text-sm text-center">
                      Selecione uma seção para editar
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 shrink-0 px-4 py-3 bg-sidebar-bg border-b border-border z-10 space-y-2">
                    <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                      {getSectionLabel(selectedSection, effectiveUiSchema)}
                    </p>
                    {canViewEndpoint && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-brand-muted shrink-0">
                        Endpoint da seção:
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={`${apiUrl}/sections/${encodeURIComponent(getSectionKey(selectedSection))}`}
                        onFocus={(e) => e.currentTarget.select()}
                        className="flex-1 min-w-0 bg-brand-bg border border-border rounded px-2 py-1 text-[10px] text-brand-text font-mono truncate focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${apiUrl}/sections/${encodeURIComponent(getSectionKey(selectedSection))}`,
                          )
                        }
                        className="p-1 rounded text-brand-muted hover:bg-brand-btn-light hover:text-brand-text transition shrink-0"
                        title="Copiar endpoint da seção"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4">
                      <DynamicFieldRenderer
                        dataKey={selectedSection}
                        value={getDeep(localData, selectedSection.split("."))}
                        path={selectedSection.split(".")}
                        onChange={handleFieldChange}
                        onOpenMediaModal={handleOpenMediaModal}
                        onFocusField={handleFocusField}
                        uploadingPaths={uploadingPaths}
                        uiSchema={effectiveUiSchema}
                        inline
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="shrink-0 p-3 border-t border-brand-btn-light bg-sidebar-bg">
                <button
                  type="button"
                  onClick={handleSaveContent}
                  disabled={
                    isPending || uploadingPaths.size > 0 || !hasUnsavedChanges
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-cta text-white hover:bg-brand-cta-hover transition disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </aside>
          </>
        )}

        {cmsModalOpen && initialCmsEnabled && projectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setCmsModalOpen(false)} />
            <div className="relative bg-card rounded-xl shadow-lg p-6 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-4 border border-brand-btn-light">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-primary" />
                  <h2 className="text-base font-semibold text-brand-text">Integração Front-end</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCmsModalOpen(false)}
                  className="p-1 rounded hover:bg-brand-btn-light/40 text-brand-muted hover:text-brand-text transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-brand-text">Script de sincronização</p>
                  <p className="text-[11px] text-brand-muted leading-relaxed">
                    Gere o script e adicione-o ao HTML do seu front-end. O CMS detectará elementos com{" "}
                    <code className="bg-brand-btn-light px-1 rounded text-[10px]">data-cms-section</code>{" "}
                    e{" "}
                    <code className="bg-brand-btn-light px-1 rounded text-[10px]">data-cms-field</code>{" "}
                    automaticamente.
                  </p>
                </div>

                {cmsSyncScriptUrl ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-brand-muted uppercase tracking-wide">Tag pronta</p>
                    <pre className="text-[10px] bg-brand-bg border border-border rounded-lg p-3 overflow-x-auto text-brand-text font-mono whitespace-pre-wrap break-all leading-relaxed">
                      {`<script src="${cmsSyncScriptUrl}" defer></script>`}
                    </pre>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCopyScriptTag}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-brand-primary text-white hover:bg-brand-hover transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Script
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateScript}
                        disabled={isGeneratingScript}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-brand-text hover:bg-brand-btn-light/40 transition disabled:opacity-60"
                        title="Regerar script na CDN"
                      >
                        {isGeneratingScript ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-brand-primary text-white hover:bg-brand-hover transition disabled:opacity-60"
                  >
                    {isGeneratingScript ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Code2 className="w-3.5 h-3.5" />
                    )}
                    {isGeneratingScript ? "Gerando..." : "Gerar Script CDN"}
                  </button>
                )}

                {scriptFeedback && (
                  <p className={`text-xs flex items-center gap-1.5 ${scriptFeedback.type === "success" ? "text-brand-primary" : "text-destructive"}`}>
                    {scriptFeedback.type === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {scriptFeedback.message}
                  </p>
                )}

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Como usar no front-end</p>
                  <ul className="text-[11px] text-brand-muted space-y-1.5 leading-relaxed">
                    <li>
                      1. Adicione a tag{" "}
                      <code className="bg-brand-btn-light px-1 rounded text-[10px]">&lt;script&gt;</code>{" "}
                      no{" "}
                      <code className="bg-brand-btn-light px-1 rounded text-[10px]">&lt;head&gt;</code>{" "}
                      do seu HTML
                    </li>
                    <li>
                      2. Marque seções com{" "}
                      <code className="bg-brand-btn-light px-1 rounded text-[10px]">data-cms-section=&quot;nome&quot;</code>
                    </li>
                    <li>
                      3. Marque campos com{" "}
                      <code className="bg-brand-btn-light px-1 rounded text-[10px]">data-cms-field=&quot;campo&quot;</code>
                    </li>
                    <li>4. O script só ativa dentro do iframe do CMS — não afeta produção</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <MediaUploadModal
          isOpen={mediaModal.open}
          onClose={() => setMediaModal((prev) => ({ ...prev, open: false }))}
          onUrlSubmit={handleMediaUrlSubmit}
          onFileUpload={handleMediaFileUpload}
          mediaType={mediaModal.mediaType}
          isUploading={uploadingPaths.has(mediaModal.path.join("."))}
        />
      </div>
    </div>
  );
}
