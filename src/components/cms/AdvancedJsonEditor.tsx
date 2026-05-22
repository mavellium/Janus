"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  BookOpen,
  X,
  Copy,
} from "lucide-react";
import { DynamicFieldRenderer } from "./DynamicFieldRenderer";
import { MediaUploadModal } from "@/components/schema-builder/MediaUploadModal";
import { updatePageContentData } from "@/modules/projects/actions/updatePageContentData";
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

const INBUILT_TEMPLATES: {
  label: string;
  template: Record<string, unknown>;
}[] = [
  {
    label: "Hero",
    template: {
      active: true,
      title: "",
      subtitle: "",
      backgroundImage: "",
      backgroundVideo: "",
      cta: { text: "Saiba Mais", href: "/", icon: "ArrowRight" },
    },
  },
  {
    label: "Cards",
    template: {
      title: "",
      items: [{ title: "", description: "", image: "", icon: "", link: "" }],
    },
  },
  {
    label: "Equipe",
    template: {
      title: "",
      members: [{ name: "", role: "", bio: "", photo: "", linkedin: "" }],
    },
  },
  {
    label: "Depoimentos",
    template: {
      title: "",
      testimonials: [{ name: "", role: "", company: "", photo: "", text: "" }],
    },
  },
  {
    label: "FAQ",
    template: {
      title: "",
      items: [{ question: "", answer: "" }],
    },
  },
  {
    label: "Parágrafos",
    template: {
      title: "",
      paragraphs: ["", ""],
    },
  },
  {
    label: "CTA",
    template: {
      title: "",
      subtitle: "",
      backgroundColor: "#000000",
      cta: { text: "Começar agora", href: "/", icon: "ArrowRight" },
    },
  },
  {
    label: "SEO",
    template: {
      metaTitle: "",
      metaDescription: "",
      ogImage: "",
      ogTitle: "",
    },
  },
  {
    label: "Mídia",
    template: {
      active: true,
      image: "",
      video: "",
      caption: "",
      altText: "",
    },
  },
  {
    label: "Estatísticas",
    template: {
      title: "",
      items: [{ label: "", value: 0, suffix: "+", icon: "" }],
    },
  },
];

interface AdvancedJsonEditorProps {
  pageId: string;
  data: Record<string, unknown>;
  initialUiSchema?: Record<string, unknown>;
  onReplaceData?: (data: Record<string, unknown>) => void;
  onDataChange?: (data: Record<string, unknown>) => void;
  onUiSchemaChange?: (uiSchema: Record<string, unknown>) => void;
  onSave?: () => void;
  isDevMode: boolean;
  showFormPanel?: boolean;
}

interface MediaModalState {
  open: boolean;
  path: string[];
  mediaType: "image" | "video";
}

function setDeep(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) return obj;
  const clone = structuredClone(obj);
  let current: Record<string, unknown> | unknown[] = clone;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];
    const isNextIndex = /^\d+$/.test(nextKey);
    if (Array.isArray(current)) {
      const idx = parseInt(key, 10);
      if (current[idx] === undefined || current[idx] === null) {
        current[idx] = isNextIndex ? [] : {};
      }
      current = current[idx] as Record<string, unknown> | unknown[];
    } else {
      const rec = current as Record<string, unknown>;
      if (rec[key] === undefined || rec[key] === null) {
        rec[key] = isNextIndex ? [] : {};
      }
      current = rec[key] as Record<string, unknown> | unknown[];
    }
  }
  const lastKey = path[path.length - 1];
  if (Array.isArray(current)) {
    (current as unknown[])[parseInt(lastKey, 10)] = value;
  } else {
    (current as Record<string, unknown>)[lastKey] = value;
  }
  return clone;
}

export function AdvancedJsonEditor({
  pageId,
  data,
  initialUiSchema = {},
  onReplaceData,
  onDataChange,
  onUiSchemaChange,
  onSave,
  isDevMode,
  showFormPanel = true,
}: AdvancedJsonEditorProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>(data);
  const [rawJson, setRawJson] = useState(() => JSON.stringify(data, null, 2));
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [uiSchemaLocal, setUiSchemaLocal] =
    useState<Record<string, unknown>>(initialUiSchema);
  const [rawUiSchema, setRawUiSchema] = useState(() =>
    JSON.stringify(initialUiSchema, null, 2),
  );
  const [isUiSchemaValid, setIsUiSchemaValid] = useState(true);
  const [activeEditorTab, setActiveEditorTab] = useState<"data" | "ui">("data");
  const [showDocs, setShowDocs] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [uploadingPaths, setUploadingPaths] = useState<Set<string>>(new Set());
  const [mediaModal, setMediaModal] = useState<MediaModalState>({
    open: false,
    path: [],
    mediaType: "image",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (
      initialUiSchema &&
      typeof initialUiSchema === "object" &&
      !Array.isArray(initialUiSchema)
    ) {
      setUiSchemaLocal(initialUiSchema as Record<string, unknown>);
      setRawUiSchema(JSON.stringify(initialUiSchema, null, 2));
    }
  }, [initialUiSchema]);

  useEffect(() => {
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      setLocalData(data);
      setRawJson(JSON.stringify(data, null, 2));
    }
  }, [data]);

  const fireReplace = useCallback(
    (next: Record<string, unknown>) => {
      if (!onReplaceData) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onReplaceData(next), 400);
    },
    [onReplaceData],
  );

  const handleFieldChange = useCallback(
    (path: string[], value: unknown) => {
      setLocalData((prev) => {
        const next = setDeep(prev, path, value);
        setRawJson(JSON.stringify(next, null, 2));
        fireReplace(next);
        onDataChange?.(next);
        return next;
      });
    },
    [fireReplace, onDataChange],
  );

  const handleRawJsonChange = (val: string | undefined) => {
    const str = val ?? "";
    setRawJson(str);
    try {
      const parsed = JSON.parse(str);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        const next = parsed as Record<string, unknown>;
        setLocalData(next);
        setIsJsonValid(true);
        fireReplace(next);
        onDataChange?.(next);
      } else {
        setIsJsonValid(false);
      }
    } catch {
      setIsJsonValid(false);
    }
  };

  const handleRawUiSchemaChange = (val: string | undefined) => {
    const str = val ?? "";
    setRawUiSchema(str);
    try {
      const parsed = JSON.parse(str);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        const next = parsed as Record<string, unknown>;
        setUiSchemaLocal(next);
        setIsUiSchemaValid(true);
        onUiSchemaChange?.(next);
      } else {
        setIsUiSchemaValid(false);
      }
    } catch {
      setIsUiSchemaValid(false);
    }
  };

  const handleInjectTemplate = (
    label: string,
    template: Record<string, unknown>,
  ) => {
    const key = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "_");
    const sectionKey = Object.prototype.hasOwnProperty.call(localData, key)
      ? `${key}_${Date.now()}`
      : key;
    const next = { ...localData, [sectionKey]: template };
    setLocalData(next);
    setRawJson(JSON.stringify(next, null, 2));
    onReplaceData?.(next);
    onDataChange?.(next);
  };

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await updatePageContentData({
        pageId,
        contentData: localData,
      });
      if (result.ok) {
        setFeedback({ type: "success", message: "Salvo com sucesso!" });
        onSave?.();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Erro ao salvar",
        });
      }
    });
  };

  const handleOpenMediaModal = (
    path: string[],
    mediaType: "image" | "video",
  ) => {
    setMediaModal({ open: true, path, mediaType });
  };

  const handleMediaUrlSubmit = (url: string) => {
    handleFieldChange(mediaModal.path, url);
    setMediaModal((prev) => ({ ...prev, open: false }));
  };

  const handleMediaFileUpload = async (file: File) => {
    const pathKey = mediaModal.path.join(".");
    const currentPath = mediaModal.path;
    setUploadingPaths((prev) => new Set([...prev, pathKey]));
    const result = await uploadMedia({ file, folder: "media" });
    setUploadingPaths((prev) => {
      const n = new Set(prev);
      n.delete(pathKey);
      return n;
    });
    if (result.ok && result.url) {
      handleFieldChange(currentPath, result.url);
      setMediaModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handleCopyPrompt = () => {
    const prompt = `Você é um gerador de UI Schema para um CMS headless.

REGRA FUNDAMENTAL:
A chave no UI Schema = o caminho exato do campo no JSON de dados.
Sem prefixo obrigatório. A estrutura reflete os dados.

SINTAXE DAS CHAVES:
- Raiz (seção no menu): "secao" → { "ui:label": "..." }
- Campo direto: "secao.campo"
- Em array: "secao.lista.*.campo"  (* substitui o índice numérico)
- Array aninhado: "secao.lista.*.sublista.*.campo"
- Escalar na raiz: "msgFinal" → { "ui:label": "..." }

PROPRIEDADES DE CADA ENTRADA:
- "ui:label": "Texto legível"       (obrigatório para campos visíveis)
- "ui:widget": "tipo"               (veja tabela abaixo)
- "ui:color": "#hex"                (borda esquerda colorida no campo)
- "ui:size": "sm|md|lg|xl"         (altura da textarea: 48/80/160/280px)
- "ui:placeholder": "exemplo..."   (dica dentro do campo)
- "ui:description": "instrução..." (texto fixo abaixo do campo)

WIDGETS DISPONÍVEIS:
text     → texto curto (padrão para strings)
textarea → texto longo
image    → upload de imagem
video    → upload de vídeo
url      → campo de link/href
color    → seletor de cor (hex)
boolean  → switch true/false
number   → campo numérico
icon     → galeria de ícones Lucide
hidden   → invisível (dado preservado no JSON)

QUANDO USAR CADA WIDGET:
- image:    chave contém img, photo, logo, foto, src, bg, banner, avatar, capa, cover
- video:    chave contém video, vid, ou valor termina em .mp4/.webm
- url:      chave contém link, url, href
- color:    chave contém color, cor, ou valor começa com #
- textarea: chave contém desc, bio, depoimento, body, text, about, resumo, summary
            OU valor tem mais de 80 caracteres no JSON de exemplo
- boolean:  valor é true ou false
- number:   valor é um número
- icon:     chave é "icon" ou "icone"
- hidden:   id, _id, key, order, type (rich-text estrutural), slug, variant, size, target, action

5 PADRÕES QUE VOCÊ DEVE RECONHECER:

1. RICH-TEXT ARRAY: campo = [{type, value}] ou [{type, value, color}]
   → type: hidden (campo estrutural do rich-text)
   → value: textarea (o texto editável)
   → color: color widget (editável, representa cor de destaque)
   Exemplo de dado: "title": [{"type":"highlight","color":"#f00","value":"Texto"}]
   UI Schema:
   "title": {"ui:label": "Título"},
   "title.*.type": {"ui:widget": "hidden"},
   "title.*.value": {"ui:label": "Texto"},
   "title.*.color": {"ui:label": "Cor de destaque", "ui:widget": "color"}

2. ARRAY DE OBJETOS: campo = [{id, campo1, campo2}]
   → id/key/order: hidden
   → campos de conteúdo: label + widget correto
   Exemplo de dado: "cards": [{"id":1,"title":"","img":"","bio":""}]
   UI Schema:
   "cards": {"ui:label": "Cards"},
   "cards.*.id": {"ui:widget": "hidden"},
   "cards.*.title": {"ui:label": "Título"},
   "cards.*.img": {"ui:label": "Imagem", "ui:widget": "image"},
   "cards.*.bio": {"ui:label": "Biografia", "ui:widget": "textarea", "ui:size": "lg"}

3. ARRAY ANINHADO: item do array contém outro array
   → use wildcard duplo (*.*) para acessar campos do array filho
   Exemplo de dado: "parceiros": [{"depoimento": [{"type":"text","value":"..."}]}]
   UI Schema:
   "parceiros.*.depoimento.*.type": {"ui:widget": "hidden"},
   "parceiros.*.depoimento.*.value": {"ui:label": "Depoimento", "ui:widget": "textarea"}

4. OBJETO FIXO: campo = {subfield1, subfield2, ...}
   → dot-notation direta, sem *
   → esconda campos estruturais (size, variant, action, target, type)
   Exemplo de dado: "button": {"label":"","link":"/","size":"lg","variant":"primary"}
   UI Schema:
   "button": {"ui:label": "Botão"},
   "button.label": {"ui:label": "Texto do botão"},
   "button.link": {"ui:label": "Link", "ui:widget": "url"},
   "button.size": {"ui:widget": "hidden"},
   "button.variant": {"ui:widget": "hidden"}

5. ESCALAR NA RAIZ: campo = "string" ou número no topo do JSON
   → entrada simples com ui:label
   Exemplo de dado: "msgFinal": "Vagas limitadas"
   UI Schema:
   "msgFinal": {"ui:label": "Mensagem Final"}

REGRAS ADICIONAIS:
- Use emojis nos ui:label das seções raiz para melhorar o visual
- Campos com valor hex (#rrggbb) → ui:widget: "color"
- IDs numéricos e campos de enum técnico → hidden
- Agrupe campos relacionados usando a mesma ui:color
- Seção raiz com ui:label e sem * e sem pai com ui:label → vira seção no menu lateral

MEU JSON DE DADOS:
[COLE SEU JSON AQUI]

Retorne APENAS o JSON válido do UI Schema, sem markdown, sem explicações, sem comentários.`;
    navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const entries = Object.entries(localData);

  const formPanel = (
    <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3">
      <div className="flex flex-col gap-2 sm:gap-3">
        {entries.map(([key, val]) => {
          const uiEntry = uiSchemaLocal[key];
          const uiConfig =
            typeof uiEntry === "object" && uiEntry !== null
              ? (uiEntry as {
                  "ui:label"?: string;
                  "ui:description"?: string;
                  "ui:widget"?: string;
                })
              : {};
          if (uiConfig["ui:widget"] === "hidden") return null;
          const label = uiConfig["ui:label"] ?? key;
          return (
            <div key={key} className="space-y-1.5">
              <label className="block text-[11px] sm:text-xs font-medium text-brand-muted capitalize truncate">
                {label}
              </label>
              {uiConfig["ui:description"] && (
                <p className="text-[10px] text-brand-muted leading-relaxed">
                  {uiConfig["ui:description"]}
                </p>
              )}
              <DynamicFieldRenderer
                dataKey={key}
                value={val}
                path={[key]}
                onChange={handleFieldChange}
                onOpenMediaModal={handleOpenMediaModal}
                uploadingPaths={uploadingPaths}
                uiSchema={uiSchemaLocal}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  const monacoOptions = {
    minimap: { enabled: false },
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    fontSize: 13,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    automaticLayout: true,
  };

  return (
    <div className="flex flex-col h-full bg-sidebar-bg">
      {isDevMode ? (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
          <div
            className={`flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-hidden ${
              showFormPanel ? "w-full lg:w-2/5" : "w-full"
            }`}
          >
            <div className="px-2.5 py-1.5 border-b border-border shrink-0 flex items-center justify-between gap-1.5 bg-card">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveEditorTab("data")}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition ${
                    activeEditorTab === "data"
                      ? "bg-brand-primary text-white"
                      : "text-brand-muted hover:text-brand-text"
                  }`}
                >
                  Dados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditorTab("ui")}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition flex items-center gap-1 ${
                    activeEditorTab === "ui"
                      ? "bg-brand-primary text-white"
                      : "text-brand-muted hover:text-brand-text"
                  }`}
                >
                  Interface
                  {!isUiSchemaValid && activeEditorTab !== "ui" && (
                    <AlertCircle className="w-2.5 h-2.5 text-destructive" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {activeEditorTab === "data" && !isJsonValid && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    Inválido
                  </span>
                )}
                {activeEditorTab === "ui" && !isUiSchemaValid && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    Inválido
                  </span>
                )}
                {activeEditorTab === "ui" && (
                  <button
                    type="button"
                    onClick={() => setShowDocs((v) => !v)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                      showDocs
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Docs
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 relative">
              <div
                className={
                  activeEditorTab === "data" ? "absolute inset-0" : "hidden"
                }
              >
                <MonacoEditor
                  height="100%"
                  language="json"
                  value={rawJson}
                  onChange={handleRawJsonChange}
                  theme={isDark ? "vs-dark" : "light"}
                  options={monacoOptions}
                />
              </div>
              <div
                className={
                  activeEditorTab === "ui" ? "absolute inset-0" : "hidden"
                }
              >
                <MonacoEditor
                  height="100%"
                  language="json"
                  value={rawUiSchema}
                  onChange={handleRawUiSchemaChange}
                  theme={isDark ? "vs-dark" : "light"}
                  options={monacoOptions}
                />
              </div>
            </div>

            {activeEditorTab === "data" && (
              <div className="shrink-0 px-2.5 py-1.5 border-t border-border bg-card">
                <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">
                  Templates
                </p>
                <div className="flex flex-wrap gap-1">
                  {INBUILT_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => handleInjectTemplate(t.label, t.template)}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-brand-btn-light hover:bg-brand-btn-light/80 rounded transition text-brand-text whitespace-nowrap"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showFormPanel && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {formPanel}
            </div>
          )}

          {showDocs && (
            <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border flex flex-col z-10 shadow-lg">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-muted" />
                  <span className="text-xs font-semibold text-brand-text">
                    📖 Como personalizar a tela do cliente
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocs(false)}
                  className="p-1 rounded hover:bg-brand-btn-light/40 text-brand-muted hover:text-brand-text transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto text-xs text-brand-muted">
                <div className="px-3 py-3 border-b border-border bg-brand-bg/40">
                  <p className="leading-relaxed text-brand-text">
                    <span className="font-semibold">O JSON de Dados</span> é o
                    motor do site — feito para o sistema ler. O{" "}
                    <span className="font-semibold">UI Schema</span> é a
                    &quot;maquiagem&quot; — feito para deixar a tela amigável
                    para o cliente usar.
                  </p>
                  <p className="mt-1.5 leading-relaxed">
                    Ele não altera os dados do banco. Apenas troca nomes,
                    esconde códigos sensíveis e muda o visual das caixinhas.
                  </p>
                </div>

                <div className="px-3 py-3 border-b border-border">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-2.5">
                    1. O que cada propriedade faz?
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">
                          ui:label
                        </code>
                        <span className="font-medium text-brand-text">
                          O Nome Bonito
                        </span>
                      </div>
                      <p className="leading-relaxed pl-0.5">
                        Substitui a chave técnica por um nome legível.
                      </p>
                      <p className="mt-0.5 pl-0.5 text-brand-text/60 italic">
                        Ex:{" "}
                        <code className="font-mono not-italic">hero_title</code>{" "}
                        → &quot;Título Principal&quot;
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">
                          ui:widget
                        </code>
                        <span className="font-medium text-brand-text">
                          A Ferramenta
                        </span>
                      </div>
                      <p className="leading-relaxed pl-0.5">
                        Define qual tipo de campo usar. Sem isso, o sistema
                        tenta adivinhar pelo nome da chave e pelo valor.
                      </p>
                      <p className="mt-0.5 pl-0.5 text-brand-text/60 italic">
                        Ex: <code className="font-mono not-italic">bio</code>{" "}
                        seria texto curto — com{" "}
                        <code className="font-mono not-italic">
                          &quot;textarea&quot;
                        </code>{" "}
                        vira caixa grande.
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">
                          ui:description
                        </code>
                        <span className="font-medium text-brand-text">
                          A Instrução
                        </span>
                      </div>
                      <p className="leading-relaxed pl-0.5">
                        Texto de ajuda exibido permanentemente abaixo do campo.
                      </p>
                      <p className="mt-0.5 pl-0.5 text-brand-text/60 italic">
                        Ex: &quot;Recomendamos no máximo 3 linhas.&quot;
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">
                          ui:placeholder
                        </code>
                        <span className="font-medium text-brand-text">
                          A Dica Discreta
                        </span>
                      </div>
                      <p className="leading-relaxed pl-0.5">
                        Texto de exemplo dentro do campo que some quando o
                        cliente começa a digitar. Diferente do{" "}
                        <code className="font-mono text-brand-primary">
                          ui:description
                        </code>
                        : ele fica <em>dentro</em> da caixa, não abaixo.
                      </p>
                      <p className="mt-0.5 pl-0.5 text-brand-text/60 italic">
                        Ex: &quot;Ex: A empresa que transforma o seu
                        mercado&quot;
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">
                          ui:color
                        </code>
                        <span className="font-medium text-brand-text">
                          A Cor de Destaque
                        </span>
                      </div>
                      <p className="leading-relaxed pl-0.5">
                        Pinta a borda esquerda do campo com a cor que você
                        escolher (hex). Ótimo para sinalizar campos
                        obrigatórios, agrupar campos relacionados ou
                        simplesmente organizar visualmente a tela.
                      </p>
                      <p className="mt-0.5 pl-0.5 text-brand-text/60 italic">
                        Ex:{" "}
                        <code className="font-mono not-italic">
                          &quot;#ef4444&quot;
                        </code>{" "}
                        para campos críticos,{" "}
                        <code className="font-mono not-italic">
                          &quot;#6366f1&quot;
                        </code>{" "}
                        para grupo de branding.
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">
                          ui:size
                        </code>
                        <span className="font-medium text-brand-text">
                          O Tamanho
                        </span>
                      </div>
                      <p className="leading-relaxed pl-0.5">
                        Controla a altura mínima de campos{" "}
                        <code className="font-mono text-brand-primary">
                          textarea
                        </code>
                        . Use quando o conteúdo for longo e uma caixinha pequena
                        não fizer sentido visualmente.
                      </p>
                      <div className="mt-1 pl-0.5 flex gap-2 flex-wrap">
                        {(
                          [
                            ["sm", "48px"],
                            ["md", "padrão"],
                            ["lg", "160px"],
                            ["xl", "280px"],
                          ] as [string, string][]
                        ).map(([s, h]) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 bg-brand-bg border border-border rounded px-1.5 py-0.5 text-[10px]"
                          >
                            <code className="font-mono text-brand-primary">
                              {s}
                            </code>
                            <span className="text-brand-muted">→ {h}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <code className="text-[10px] font-mono text-brand-primary bg-brand-bg border border-border rounded px-1.5 py-0.5">
                          ui:widget: &quot;hidden&quot;
                        </code>
                        <span className="font-medium text-brand-text">
                          O Invisível
                        </span>
                      </div>
                      <p className="leading-relaxed pl-0.5">
                        Esconde o campo completamente. O dado continua salvo no
                        JSON — apenas não aparece na tela do cliente. Perfeito
                        para IDs, slugs e variáveis de sistema.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-3 border-b border-border">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-2.5">
                    2. Todas as propriedades disponíveis
                  </p>

                  <p className="text-[10px] font-semibold text-brand-text mb-1.5">
                    ui:widget — tipo do campo
                  </p>
                  <table className="w-full border-collapse mb-3">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left pb-1.5 font-semibold text-brand-text text-[10px] pr-3">
                          Valor
                        </th>
                        <th className="text-left pb-1.5 font-semibold text-brand-text text-[10px]">
                          O que aparece
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          ["text", "Linha de texto curta."],
                          ["textarea", "Caixa grande para textos longos."],
                          ["image", "Upload de foto para a nuvem."],
                          ["video", "Upload de vídeo."],
                          ["url", "Campo de link (azul, mono)."],
                          ["color", "Seletor visual de cor (paleta)."],
                          ["boolean", "Switch ligar/desligar."],
                          ["icon", "Galeria visual de ícones Lucide."],
                          ["hidden", "Invisível ao cliente."],
                        ] as [string, string][]
                      ).map(([word, desc]) => (
                        <tr key={word} className="border-b border-border/40">
                          <td className="py-1.5 pr-3 align-top">
                            <code className="font-mono text-[10px] text-brand-primary">
                              {word}
                            </code>
                          </td>
                          <td className="py-1.5 leading-relaxed align-top">
                            {desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="text-[10px] font-semibold text-brand-text mb-1.5">
                    ui:color — cor de destaque
                  </p>
                  <p className="leading-relaxed mb-1.5">
                    Pinta a borda esquerda do campo com uma cor hex. Ótimo para
                    destacar campos importantes ou agrupar visualmente campos do
                    mesmo grupo.
                  </p>
                  <pre className="text-[10px] font-mono text-brand-text bg-brand-bg border border-border rounded p-2 mb-3 overflow-x-auto">{`"slides.*.headline": {
  "ui:label": "Headline",
  "ui:color": "#00D26A"
}`}</pre>

                  <p className="text-[10px] font-semibold text-brand-text mb-1.5">
                    ui:size — tamanho da textarea
                  </p>
                  <p className="leading-relaxed mb-1.5">
                    Controla a altura mínima de campos{" "}
                    <code className="font-mono text-brand-primary">
                      textarea
                    </code>
                    .
                  </p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {(
                      [
                        ["sm", "48px"],
                        ["md", "padrão"],
                        ["lg", "160px"],
                        ["xl", "280px"],
                      ] as [string, string][]
                    ).map(([s, h]) => (
                      <div
                        key={s}
                        className="flex items-center gap-1 bg-brand-bg border border-border rounded px-2 py-1"
                      >
                        <code className="font-mono text-[10px] text-brand-primary">
                          {s}
                        </code>
                        <span className="text-[10px] text-brand-muted">
                          → {h}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] font-semibold text-brand-text mb-1.5">
                    ui:placeholder — texto de dica
                  </p>
                  <p className="leading-relaxed">
                    Substitui o placeholder automático gerado pelo sistema.
                  </p>
                  <pre className="text-[10px] font-mono text-brand-text bg-brand-bg border border-border rounded p-2 mt-1.5 overflow-x-auto">{`"hero.title": {
  "ui:label": "Título",
  "ui:placeholder": "Ex: A solução que a sua empresa precisa"
}`}</pre>
                </div>

                <div className="px-3 py-3 border-b border-border">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">
                    3. Como as chaves funcionam
                  </p>
                  <p className="leading-relaxed mb-2">
                    A chave no UI Schema é o{" "}
                    <span className="font-medium text-brand-text">
                      caminho exato
                    </span>{" "}
                    do campo no JSON de dados.{" "}
                    <span className="font-medium text-brand-text">
                      Sem prefixo obrigatório
                    </span>{" "}
                    — a estrutura reflete os seus dados.
                  </p>
                  <div className="space-y-1.5 bg-brand-bg border border-border rounded p-2 mb-2">
                    {(
                      [
                        ["Raiz (seção)", "parceiros"],
                        ["Campo direto", "parceiros.titulo"],
                        ["Em array", "parceiros.*.nome"],
                        ["Array aninhado", "parceiros.*.dep.*.value"],
                        ["Objeto fixo", "button.link"],
                        ["Escalar na raiz", "msgFinal"],
                      ] as [string, string][]
                    ).map(([tipo, chave]) => (
                      <p key={chave}>
                        <span className="font-medium text-brand-text">
                          {tipo}:
                        </span>{" "}
                        <code className="font-mono text-[10px] text-brand-primary">
                          {chave}
                        </code>
                      </p>
                    ))}
                    <p className="text-brand-text/60 italic text-[10px] pt-0.5">
                      O{" "}
                      <code className="font-mono not-italic text-brand-primary">
                        *
                      </code>{" "}
                      substitui índices numéricos e aplica a regra para todos os
                      itens da lista.
                    </p>
                  </div>
                  <p className="leading-relaxed text-[10px]">
                    <span className="font-semibold text-brand-text">
                      Seções no menu lateral
                    </span>{" "}
                    = chaves raiz com{" "}
                    <code className="font-mono text-brand-primary">
                      ui:label
                    </code>
                    , sem{" "}
                    <code className="font-mono text-brand-primary">*</code> e
                    sem pai com{" "}
                    <code className="font-mono text-brand-primary">
                      ui:label
                    </code>
                    .
                  </p>
                </div>

                <div className="px-3 py-3 border-b border-border">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-2.5">
                    4. 5 Padrões que toda IA precisa conhecer
                  </p>
                  <div className="space-y-3">
                    <div className="border border-border rounded overflow-hidden">
                      <div className="bg-brand-bg px-2 py-1.5 border-b border-border">
                        <p className="font-semibold text-brand-text text-[10px]">
                          1. Rich-text Array{" "}
                          <code className="font-mono font-normal text-brand-muted">
                            [{"{"}type, value{"}"}]
                          </code>
                        </p>
                        <p className="text-[10px] leading-relaxed text-brand-muted mt-0.5">
                          <code className="font-mono text-brand-primary">
                            type
                          </code>{" "}
                          é estrutural → hidden.{" "}
                          <code className="font-mono text-brand-primary">
                            value
                          </code>{" "}
                          é o texto editável.{" "}
                          <code className="font-mono text-brand-primary">
                            color
                          </code>{" "}
                          fica visível se for cor de destaque.
                        </p>
                      </div>
                      <pre className="text-[10px] font-mono text-brand-text bg-card p-2 overflow-x-auto whitespace-pre leading-relaxed">{`"title.*.type":  { "ui:widget": "hidden" },
"title.*.value": { "ui:label": "Texto" },
"title.*.color": { "ui:label": "Cor", "ui:widget": "color" }`}</pre>
                    </div>

                    <div className="border border-border rounded overflow-hidden">
                      <div className="bg-brand-bg px-2 py-1.5 border-b border-border">
                        <p className="font-semibold text-brand-text text-[10px]">
                          2. Array de Objetos{" "}
                          <code className="font-mono font-normal text-brand-muted">
                            [{"{"}id, campo1, campo2{"}"}]
                          </code>
                        </p>
                        <p className="text-[10px] leading-relaxed text-brand-muted mt-0.5">
                          id/key/order sempre hidden. Campos de conteúdo com
                          label e widget correto.
                        </p>
                      </div>
                      <pre className="text-[10px] font-mono text-brand-text bg-card p-2 overflow-x-auto whitespace-pre leading-relaxed">{`"cards": { "ui:label": "🃏 Cards" },
"cards.*.id":    { "ui:widget": "hidden" },
"cards.*.title": { "ui:label": "Título" },
"cards.*.img":   { "ui:label": "Imagem", "ui:widget": "image" },
"cards.*.bio":   { "ui:label": "Bio", "ui:widget": "textarea" }`}</pre>
                    </div>

                    <div className="border border-border rounded overflow-hidden">
                      <div className="bg-brand-bg px-2 py-1.5 border-b border-border">
                        <p className="font-semibold text-brand-text text-[10px]">
                          3. Array Aninhado{" "}
                          <code className="font-mono font-normal text-brand-muted">
                            [{"{"}lista:[...]{"}"} ]
                          </code>
                        </p>
                        <p className="text-[10px] leading-relaxed text-brand-muted mt-0.5">
                          Array dentro de array usa wildcard duplo{" "}
                          <code className="font-mono text-brand-primary">
                            *.*.campo
                          </code>
                          .
                        </p>
                      </div>
                      <pre className="text-[10px] font-mono text-brand-text bg-card p-2 overflow-x-auto whitespace-pre leading-relaxed">{`// parceiros[0].depoimento[0].value
"parceiros.*.depoimento.*.type":
  { "ui:widget": "hidden" },
"parceiros.*.depoimento.*.value":
  { "ui:label": "Depoimento", "ui:widget": "textarea" }`}</pre>
                    </div>

                    <div className="border border-border rounded overflow-hidden">
                      <div className="bg-brand-bg px-2 py-1.5 border-b border-border">
                        <p className="font-semibold text-brand-text text-[10px]">
                          4. Objeto Fixo{" "}
                          <code className="font-mono font-normal text-brand-muted">
                            {"{"}label, link, size{"}"}
                          </code>
                        </p>
                        <p className="text-[10px] leading-relaxed text-brand-muted mt-0.5">
                          Dot-notation direta, sem{" "}
                          <code className="font-mono text-brand-primary">
                            *
                          </code>
                          . Campos técnicos (size, variant, action, target) →
                          hidden.
                        </p>
                      </div>
                      <pre className="text-[10px] font-mono text-brand-text bg-card p-2 overflow-x-auto whitespace-pre leading-relaxed">{`"button":         { "ui:label": "🔘 Botão" },
"button.label":   { "ui:label": "Texto do botão" },
"button.link":    { "ui:label": "Link", "ui:widget": "url" },
"button.size":    { "ui:widget": "hidden" },
"button.variant": { "ui:widget": "hidden" }`}</pre>
                    </div>

                    <div className="border border-border rounded overflow-hidden">
                      <div className="bg-brand-bg px-2 py-1.5 border-b border-border">
                        <p className="font-semibold text-brand-text text-[10px]">
                          5. Escalar na Raiz{" "}
                          <code className="font-mono font-normal text-brand-muted">
                            &quot;msgFinal&quot;: &quot;texto&quot;
                          </code>
                        </p>
                        <p className="text-[10px] leading-relaxed text-brand-muted mt-0.5">
                          String ou número diretamente na raiz do JSON. Entra
                          como seção com campo único.
                        </p>
                      </div>
                      <pre className="text-[10px] font-mono text-brand-text bg-card p-2 overflow-x-auto whitespace-pre leading-relaxed">{`"msgFinal": { "ui:label": "💬 Mensagem Final" }`}</pre>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-3 border-b border-border">
                  <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-2">
                    5. Exemplo completo (todos os padrões)
                  </p>
                  <p className="leading-relaxed text-[10px] mb-2 text-brand-text/70">
                    JSON com rich-text, array de objetos, array aninhado, objeto
                    fixo e escalar:
                  </p>
                  <pre className="text-[10px] font-mono text-brand-text leading-relaxed bg-brand-bg border border-border rounded p-2 overflow-x-auto whitespace-pre mb-3">{`{
  "title": [
    {"type":"text","value":"Conheça "},
    {"type":"highlight","color":"#F9396F","value":"nosso time"}
  ],
  "button": {"label":"Falar agora","link":"/","size":"lg"},
  "msgFinal": "Vagas limitadas",
  "parceiros": [{
    "id": 1,
    "nome": "Ana Lima",
    "img_logo": "/logo.png",
    "depoimento": [{"type":"text","value":"Excelente!"}]
  }]
}`}</pre>
                  <pre className="text-[10px] font-mono text-brand-text leading-relaxed bg-brand-bg border border-border rounded p-2 overflow-x-auto whitespace-pre">{`{
  "title": { "ui:label": "📝 Título" },
  "title.*.type": { "ui:widget": "hidden" },
  "title.*.value": { "ui:label": "Texto" },
  "title.*.color": {
    "ui:label": "Cor de destaque",
    "ui:widget": "color"
  },

  "button": { "ui:label": "🔘 Botão", "ui:color": "#10b981" },
  "button.label": { "ui:label": "Texto do botão" },
  "button.link": { "ui:label": "Link", "ui:widget": "url" },
  "button.size": { "ui:widget": "hidden" },

  "msgFinal": { "ui:label": "💬 Mensagem Final" },

  "parceiros": { "ui:label": "🤝 Parceiros", "ui:color": "#f59e0b" },
  "parceiros.*.id": { "ui:widget": "hidden" },
  "parceiros.*.nome": { "ui:label": "Nome" },
  "parceiros.*.img_logo": {
    "ui:label": "Logo",
    "ui:widget": "image"
  },
  "parceiros.*.depoimento.*.type": { "ui:widget": "hidden" },
  "parceiros.*.depoimento.*.value": {
    "ui:label": "Depoimento",
    "ui:widget": "textarea",
    "ui:size": "lg"
  }
}`}</pre>
                </div>

                <div className="px-3 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">
                      6. Prompt para gerar com IA
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-brand-btn-light hover:bg-brand-btn-light/80 text-brand-text transition"
                      title="Copiar prompt"
                    >
                      <Copy className="w-3 h-3" />
                      {promptCopied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <p className="leading-relaxed text-[10px] mb-2">
                    Cole o prompt acima em qualquer IA junto com o JSON de
                    dados. O prompt completo já inclui os 5 padrões e todos os
                    widgets.
                  </p>
                  <div className="bg-brand-bg border border-border rounded p-2 space-y-1.5">
                    <p className="text-[10px] font-semibold text-brand-text">
                      O prompt cobre:
                    </p>
                    {[
                      "Regra das chaves (sem prefixo)",
                      "Todos os widgets e quando usar",
                      "5 padrões com exemplos de dado e UI",
                      "Campos que devem ser hidden",
                      "Heurística por nome de chave",
                    ].map((item) => (
                      <p key={item} className="leading-relaxed text-[10px]">
                        ✅ {item}
                      </p>
                    ))}
                  </div>
                  <p className="text-[10px] text-brand-muted/60 mt-2 italic">
                    Dica: Cole o JSON completo — quanto mais campos visíveis,
                    mais preciso o resultado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        formPanel
      )}

      {!isDevMode && (
        <div className="shrink-0 px-3 py-2 border-t border-border bg-card flex items-center justify-between gap-2">
          <div className="text-[10px] min-w-0">
            {feedback && (
              <span
                className={`flex items-center gap-1 ${
                  feedback.type === "success"
                    ? "text-brand-primary"
                    : "text-destructive"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{feedback.message}</span>
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isPending || !isJsonValid}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-brand-cta text-white hover:bg-brand-cta-hover transition disabled:opacity-60 shrink-0"
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {isPending ? "Salvando..." : "Salvar"}
            </span>
          </button>
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
  );
}
