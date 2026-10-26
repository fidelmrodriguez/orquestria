"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthToken, restoreAuthSession, type AuthUser } from "@/lib/auth-client";
import TagsInput from "@/components/tags/TagsInput";

type Tag = { id: string; name: string };
const API_BASE = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");

async function tagsRequest<T>(token: string, path: string, method: "GET" | "POST" = "GET", body?: object): Promise<T> {
  if (!API_BASE) throw new Error("Endereço da API não configurado.");
  const response = await fetch(`${API_BASE}${path}`, {
    method, cache: "no-store", headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const message = response.status === 409 ? "Já existe uma tag com esse nome ou você atingiu o limite." :
      response.status === 401 ? "Sua sessão expirou. Entre novamente." :
      response.status === 403 ? "Esta conta não pode gerenciar um catálogo pessoal." :
      response.status === 404 ? "Tag não encontrada." : `A API recusou a operação (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return response.status === 204 ? null as T : await response.json() as T;
}

export default function TagsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [catalog, setCatalog] = useState<Tag[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async (accessToken: string) => {
    const list = await tagsRequest<Tag[]>(accessToken, "/api/tags");
    if (!Array.isArray(list)) throw new Error("A API retornou tags inválidas.");
    setCatalog(list);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await restoreAuthSession();
        if (!active) return;
        const accessToken = getAuthToken();
        setUser(current); setToken(current && accessToken ? accessToken : null);
        if (current && accessToken) await refresh(accessToken);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Erro ao carregar tags."); }
      finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
  }, [refresh]);

  async function update(next: string[]) {
    if (!token || busy) return;
    const previous = catalog.map(tag => tag.name);
    const key = (name: string) => name.toLocaleLowerCase("pt-BR");
    const prevKeys = new Set(previous.map(key));
    const nextKeys = new Set(next.map(key));
    setBusy(true); setError(""); setNotice("");
    try {
      if (next.length === previous.length + 1) {
        const newName = next.find(name => !prevKeys.has(key(name)));
        if (!newName) throw new Error("Selecione uma tag válida.");
        await tagsRequest<Tag>(token, "/api/tags", "POST", { name: newName });
        setNotice(`Tag ${newName} cadastrada.`);
      } else if (next.length === previous.length - 1) {
        const removed = catalog.find(tag => !nextKeys.has(key(tag.name)));
        if (!removed) throw new Error("Não foi possível identificar a tag a remover.");
        if (!window.confirm(`Excluir a tag \"${removed.name}\" do seu catálogo? Isso não altera automaticamente as tarefas existentes.`)) return;
        await tagsRequest<void>(token, `/api/tags/${encodeURIComponent(removed.id)}/remove`, "POST");
        setNotice(`Tag ${removed.name} removida do catálogo.`);
      } else if (next.length === previous.length) {
        const differences = catalog.filter((tag, index) => tag.name !== next[index]);
        if (differences.length !== 1) throw new Error("Edite uma tag de cada vez.");
        const changed = differences[0];
        const index = catalog.findIndex(tag => tag.id === changed.id);
        await tagsRequest<Tag>(token, `/api/tags/${encodeURIComponent(changed.id)}/rename`, "POST", { name: next[index] });
        setNotice("Tag renomeada.");
      } else throw new Error("Operação não reconhecida. Faça uma alteração de cada vez.");
      await refresh(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar tags.");
      throw cause;
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-9 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
    <div className="mx-auto max-w-3xl space-y-7">
      <a href="/" className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300">← Voltar ao Kanban</a>
      <header><p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">Orquestria</p>
        <h1 className="mt-1 text-3xl font-bold">Minhas tags</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Cadastre, renomeie e remova tags. Nomes já cadastrados aparecerão como sugestão ao digitá-los nos campos integrados.</p>
      </header>
      {!ready && <p role="status">Carregando o catálogo...</p>}
      {ready && !user && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Faça login para gerenciar suas tags. <a href="/" className="underline">Ir ao login</a></p>}
      {ready && user?.accountType === "GUEST" && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">A conta Guest compartilha este catálogo com outros visitantes. Use uma conta pessoal para tags privadas.</p>}
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      {ready && user && token && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <TagsInput label="Catálogo de tags" value={catalog.map(tag => tag.name)} onChange={update} disabled={busy} maxTags={100} />
        <p className="mt-3 text-xs text-slate-500">Cada tag pertence à conta atual. Renomear ou remover uma tag no catálogo não altera retroativamente tags já salvas nas tarefas.</p>
      </section>}
    </div>
  </main>;
}
