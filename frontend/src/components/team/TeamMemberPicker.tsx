"use client";

import { useEffect, useId, useRef, useState } from "react";

export type DirectoryUser = { id: string; name: string; username: string };
type Props = {
  token: string;
  apiBase: string;
  members: DirectoryUser[];
  onAdded: (user: DirectoryUser) => Promise<void>;
  onRemove: (user: DirectoryUser) => void;
  disabled?: boolean;
};

/** Input chip-style com dropdown ligado exclusivamente ao diretório autenticado. */
export default function TeamMemberPicker({ token, apiBase, members, onAdded, onRemove, disabled = false }: Props) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<DirectoryUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const requestId = useRef(0);
  const existing = new Set(members.map(member => member.id));
  const visible = options.filter(user => !existing.has(user.id));
  const open = focused && query.trim().length >= 2 && !disabled && !busy;

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || !token || !apiBase) { setOptions([]); setLoading(false); return; }
    const abort = new AbortController();
    const id = ++requestId.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const response = await fetch(`${apiBase.replace(/\/+$/, "")}/api/users/search?q=${encodeURIComponent(term)}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: abort.signal,
        });
        if (!response.ok) throw new Error(`Não foi possível pesquisar usuários (HTTP ${response.status}).`);
        const result: unknown = await response.json();
        if (!Array.isArray(result)) throw new Error("Formato de usuários inesperado.");
        if (id === requestId.current) {
          setOptions(result.filter((user): user is DirectoryUser =>
            Boolean(user && typeof user.id === "string" && typeof user.name === "string" && typeof user.username === "string")));
          setActive(0);
        }
      } catch (cause) {
        if (!abort.signal.aborted && id === requestId.current)
          setError(cause instanceof Error ? cause.message : "Erro na pesquisa.");
      } finally { if (!abort.signal.aborted && id === requestId.current) setLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timeout); abort.abort(); };
  }, [query, token, apiBase]);

  async function add(user: DirectoryUser) {
    if (busy || disabled) return;
    setBusy(true); setError("");
    try { await onAdded(user); setQuery(""); setOptions([]); setFocused(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível adicionar o membro."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-2">
    <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Membros da equipe</label>
    <div className="relative">
      <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 focus-within:ring-2 focus-within:ring-sky-400 dark:border-slate-700 dark:bg-slate-900">
        {members.map(member => <span key={member.id} className="inline-flex max-w-full items-center gap-1 rounded bg-sky-500 px-2 py-1 text-sm font-semibold text-white">
          <span className="truncate" title={`${member.name} (@${member.username})`}>{member.name} <span className="font-normal opacity-85">@{member.username}</span></span>
          <button type="button" title={`Remover ${member.name} da equipe`} aria-label={`Remover ${member.name} da equipe`}
            onClick={() => onRemove(member)} disabled={disabled || busy} className="rounded px-1 hover:bg-sky-600 disabled:opacity-50">×</button>
        </span>)}
        <input id={inputId} role="combobox" aria-autocomplete="list" aria-expanded={open}
          aria-controls={listId} aria-activedescendant={open && visible[active] ? `${listId}-${visible[active].id}` : undefined}
          type="search" autoComplete="off" value={query} disabled={disabled || busy}
          onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (!open) return;
            if (event.key === "ArrowDown" && visible.length) { event.preventDefault(); setActive(i => Math.min(i + 1, visible.length - 1)); }
            if (event.key === "ArrowUp" && visible.length) { event.preventDefault(); setActive(i => Math.max(0, i - 1)); }
            if (event.key === "Enter" && visible[active]) { event.preventDefault(); void add(visible[active]); }
            if (event.key === "Escape") setFocused(false);
          }}
          placeholder="Busque pelo nome ou @usuário..." className="min-w-[190px] flex-1 bg-transparent p-1 text-sm text-slate-900 outline-none disabled:opacity-50 dark:text-white" />
      </div>
      {open && <ul id={listId} role="listbox" className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-600 dark:bg-slate-900">
        {loading && <li className="px-3 py-2 text-sm text-slate-500">Procurando usuários cadastrados...</li>}
        {!loading && !visible.length && <li className="px-3 py-2 text-sm text-slate-500">Nenhum usuário disponível para adicionar.</li>}
        {visible.map((user, index) => <li key={user.id} role="option" aria-selected={index === active} id={`${listId}-${user.id}`}>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => void add(user)}
            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-sky-50 dark:hover:bg-slate-800 ${index === active ? "bg-sky-50 dark:bg-slate-800" : ""}`}>
            <span className="font-medium text-slate-900 dark:text-white">{user.name}</span><span className="text-slate-500">@{user.username}</span>
          </button>
        </li>)}
      </ul>}
    </div>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    <p className="text-xs text-slate-500">Busque com ao menos 2 caracteres · escolha um resultado · × remove com confirmação. Apenas usuários reais aparecem.</p>
  </div>;
}
