"use client";

import { useEffect, useId, useRef, useState } from "react";
import { addTag, normalizeTag, removeTag, renameTag } from "@/lib/tags-utils";

type CatalogEntry = { id: string; name: string };
type Props = {
  value: string[];
  onChange: (tags: string[]) => void | boolean | Promise<void | boolean>;
  label?: string;
  disabled?: boolean;
  maxTags?: number;
  /** Opcional: ativa sugestão e cadastro de tags reais do usuário. */
  apiBase?: string;
  token?: string;
};

/** Chips com edição/remoção e autocomplete do catálogo privado de tags. */
export default function TagsInput({ value, onChange, label = "Tags", disabled = false, maxTags = 15, apiBase, token }: Props) {
  const fieldId = useId();
  const listId = useId();
  const sequence = useRef(0);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [options, setOptions] = useState<CatalogEntry[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const query = normalizeTag(text);
  const already = new Set(value.map(tag => tag.toLocaleLowerCase("pt-BR")));
  const visible = options.filter(row => !already.has(row.name.toLocaleLowerCase("pt-BR")));
  const open = focused && !disabled && !busy && query.length > 0 && Boolean(token && apiBase);

  useEffect(() => {
    const term = normalizeTag(text);
    if (!term || !apiBase || !token) { setOptions([]); setLoading(false); return; }
    const controller = new AbortController();
    const id = ++sequence.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBase.replace(/\/+$/, "")}/api/tags?q=${encodeURIComponent(term)}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Não foi possível pesquisar tags (HTTP ${response.status}).`);
        const result: unknown = await response.json();
        if (!Array.isArray(result)) throw new Error("Formato de tags inesperado.");
        if (sequence.current === id) {
          setOptions(result.filter((row): row is CatalogEntry =>
            Boolean(row && typeof row.id === "string" && typeof row.name === "string")));
          setActive(0); setError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted && sequence.current === id)
          setError(cause instanceof Error ? cause.message : "Falha ao consultar tags.");
      } finally { if (!controller.signal.aborted && sequence.current === id) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [text, apiBase, token]);

  async function persist(next: string[]): Promise<boolean> {
    if (busy || disabled || next === value) return false;
    setBusy(true); setError("");
    try {
      const saved = await onChange(next);
      if (saved === false) throw new Error("Não foi possível salvar as tags na API Java.");
      return true;
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar as tags."); return false; }
    finally { setBusy(false); }
  }

  async function add(raw: string, fromCatalog = false) {
    const name = normalizeTag(raw);
    if (!name || busy || disabled) return;
    const exact = options.find(option => option.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"));
    let canonical = exact?.name || name;
    if (already.has(canonical.toLocaleLowerCase("pt-BR"))) { setText(""); return; }
    if (value.length >= maxTags) { setError(`Limite de ${maxTags} tags atingido.`); return; }
    // Só registra tags novas: nunca duplica um nome que já exista no catálogo.
    if (!fromCatalog && !exact && token && apiBase) {
      setBusy(true); setError("");
      try {
        const response = await fetch(`${apiBase.replace(/\/+$/, "")}/api/tags`, {
          method: "POST", cache: "no-store",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (response.status === 409) {
          // Outra aba pode ter cadastrado ao mesmo tempo: busca a grafia canônica.
          const existing = await fetch(`${apiBase.replace(/\/+$/, "")}/api/tags?q=${encodeURIComponent(name)}`, {
            headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
          });
          if (!existing.ok) throw new Error("Não foi possível recuperar a tag já cadastrada.");
          const rows = await existing.json() as CatalogEntry[];
          canonical = rows.find(row => row.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))?.name || name;
        } else if (!response.ok) {
          throw new Error(`Não foi possível cadastrar a tag (HTTP ${response.status}).`);
        } else {
          canonical = ((await response.json()) as CatalogEntry).name;
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Falha ao cadastrar tag.");
        setBusy(false); return;
      }
      setBusy(false);
    }
    if (await persist(addTag(value, canonical, maxTags))) { setText(""); setFocused(false); setOptions([]); }
  }

  async function finishEdit() {
    if (editing === null || busy) return;
    const name = normalizeTag(draft);
    if (!name) { setError("Informe um nome válido para a tag."); return; }
    let canonical = name;
    // Ao renomear no drawer, a grafia nova também deve entrar no catálogo:
    // ela estará disponível como autocomplete nas próximas tarefas.
    if (token && apiBase && name.toLocaleLowerCase("pt-BR") !== value[editing].toLocaleLowerCase("pt-BR")) {
      setBusy(true); setError("");
      try {
        const base = apiBase.replace(/\/+$/, "");
        const response = await fetch(`${base}/api/tags`, {
          method: "POST", cache: "no-store",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (response.status === 409) {
          const existing = await fetch(`${base}/api/tags?q=${encodeURIComponent(name)}`, {
            headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
          });
          if (!existing.ok) throw new Error("Não foi possível consultar o catálogo de tags.");
          const options = await existing.json() as CatalogEntry[];
          const same = options.find(entry => entry.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"));
          if (!same) throw new Error("O catálogo atingiu o limite de tags ou o nome é inválido.");
          canonical = same.name;
        } else if (!response.ok) {
          throw new Error(`Não foi possível registrar a tag (HTTP ${response.status}).`);
        } else {
          canonical = ((await response.json()) as CatalogEntry).name;
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Falha ao registrar a nova tag.");
        setBusy(false); return;
      }
      setBusy(false);
    }
    const next = renameTag(value, editing, canonical);
    if (next === value || await persist(next)) { setEditing(null); setDraft(""); }
  }

  return <div className="w-full space-y-2">
    <label htmlFor={fieldId} className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</label>
    <div className="relative">
      <div className="rounded-xl border border-slate-300 bg-white p-2 focus-within:ring-1 focus-within:ring-slate-300 dark:focus-within:ring-slate-600 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-h-[40px] flex-wrap items-center gap-2">
          {value.map((tag, index) => <span key={`${index}-${tag}`} className="inline-flex max-w-full items-center gap-1 rounded bg-sky-500 px-2 py-1 text-sm font-semibold text-white">
            {editing === index ? <input autoFocus aria-label={`Editar tag ${tag}`} value={draft} maxLength={32}
              onChange={event => setDraft(event.target.value)} onBlur={() => void finishEdit()}
              onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void finishEdit(); } if (event.key === "Escape") setEditing(null); }}
              className="w-28 rounded bg-white px-1 text-slate-950 outline-none" /> : <span className="break-all">{tag}</span>}
            <button type="button" aria-label={`Editar tag ${tag}`} title="Editar tag" disabled={disabled || busy}
              onClick={() => { setEditing(index); setDraft(tag); }} className="rounded px-1 hover:bg-sky-600 disabled:opacity-50">✎</button>
            <button type="button" aria-label={`Remover tag ${tag}`} title="Remover tag" disabled={disabled || busy}
              onClick={() => void persist(removeTag(value, index))} className="rounded px-1 hover:bg-sky-600 disabled:opacity-50">×</button>
          </span>)}
        </div>
        {value.length < maxTags && <div className="mt-2 flex items-center gap-2">
          <input id={fieldId} type="text" value={text} maxLength={32}
            disabled={disabled || busy} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={open}
            aria-controls={listId} aria-activedescendant={open && visible[active] ? `${listId}-${visible[active].id}` : undefined}
            placeholder={value.length ? "Adicionar tag..." : "Digite uma tag..."}
            onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 140)}
            onChange={event => setText(event.target.value)}
            onKeyDown={event => {
              if (event.key === "ArrowDown" && open && visible.length) { event.preventDefault(); setActive(i => Math.min(i + 1, visible.length - 1)); }
              if (event.key === "ArrowUp" && open && visible.length) { event.preventDefault(); setActive(i => Math.max(0, i - 1)); }
              if (event.key === "Escape") setFocused(false);
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                if (open && visible[active] && event.key === "Enter") void add(visible[active].name, true);
                else void add(text);
              }
              if (event.key === "Backspace" && !text && value.length > 0) void persist(removeTag(value, value.length - 1));
            }}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500" />
          <button type="button" onMouseDown={event => event.preventDefault()}
            onClick={() => { if (open && visible[active]) void add(visible[active].name, true); else void add(text); }}
            disabled={disabled || busy || !query}
            aria-label="Adicionar tag" className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-blue-500">
            Adicionar
          </button>
        </div>}
      </div>
      {open && <ul id={listId} role="listbox" className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-600 dark:bg-slate-900">
        {loading && <li className="px-3 py-2 text-sm text-slate-500">Procurando tags cadastradas...</li>}
        {!loading && visible.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Nenhuma tag encontrada. Use Adicionar para cadastrar.</li>}
        {visible.map((tag, index) => <li key={tag.id} id={`${listId}-${tag.id}`} role="option" aria-selected={index === active}>
          <button type="button" className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sky-50 dark:hover:bg-slate-800 ${index === active ? "bg-sky-50 dark:bg-slate-800" : ""}`}
            onMouseDown={event => event.preventDefault()} onClick={() => void add(tag.name, true)}>{tag.name}</button>
        </li>)}
      </ul>}
    </div>
    <p className="text-xs text-slate-500">Sugestões automáticas · ✎ editar · × remover · {value.length}/{maxTags}</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>;
}
