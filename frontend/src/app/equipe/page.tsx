"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthToken, restoreAuthSession, type AuthUser } from "@/lib/auth-client";
import TeamMemberPicker, { type DirectoryUser } from "@/components/team/TeamMemberPicker";

const API_BASE = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");

async function teamRequest<T>(token: string, path: string, method: "GET" | "POST" = "GET", body?: object): Promise<T> {
  if (!API_BASE) throw new Error("URL da API não configurada.");
  const response = await fetch(`${API_BASE}${path}`, {
    method, cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) {
    if (response.status === 403) throw new Error("Sua conta não tem permissão para gerenciar esta equipe.");
    if (response.status === 409) throw new Error(method === "POST" && path.includes("/remove") ? "Reatribua as tarefas desse membro antes de removê-lo." : "Este usuário já pertence à sua equipe.");
    if (response.status === 404) throw new Error("Usuário ou membro não encontrado.");
    throw new Error(`A API recusou a operação (HTTP ${response.status}).`);
  }
  return response.status === 204 ? null as T : await response.json() as T;
}

export default function EquipePage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [members, setMembers] = useState<DirectoryUser[]>([]);
  const [pendingRemove, setPendingRemove] = useState<DirectoryUser | null>(null);

  const refresh = useCallback(async (accessToken: string) => {
    const list = await teamRequest<DirectoryUser[]>(accessToken, "/api/team/members");
    if (!Array.isArray(list)) throw new Error("A API retornou um formato inesperado para a equipe.");
    setMembers(list);
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const account = await restoreAuthSession();
        if (!live) return;
        const accessToken = getAuthToken();
        setUser(account); setToken(account && accessToken ? accessToken : null);
        if (account?.accountType === "USER" && accessToken) await refresh(accessToken);
      } catch (cause) {
        if (live) setError(cause instanceof Error ? cause.message : "Não foi possível carregar a equipe.");
      } finally { if (live) setReady(true); }
    })();
    return () => { live = false; };
  }, [refresh]);

  async function add(member: DirectoryUser) {
    if (!token || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await teamRequest(token, "/api/team/members", "POST", { userId: member.id });
      await refresh(token);
      setNotice(`${member.name} adicionado à equipe.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao adicionar membro.");
      throw cause;
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!token || !pendingRemove || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await teamRequest(token, `/api/team/members/${encodeURIComponent(pendingRemove.id)}/remove`, "POST");
      await refresh(token);
      setNotice(`${pendingRemove.name} removido da equipe.`);
      setPendingRemove(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover membro.");
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-9 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
    <div className="mx-auto max-w-3xl space-y-7">
      <a href="/" className="inline-flex text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300">← Voltar ao Kanban</a>
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">Orquestria</p>
        <h1 className="text-3xl font-bold">Equipe</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Busque contas existentes e adicione responsáveis às tarefas dos seus projetos. Para remover um membro, reatribua suas tarefas primeiro.</p>
      </header>
      {!ready && <p role="status">Carregando sua equipe...</p>}
      {ready && !user && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Faça login para gerenciar a equipe. <a href="/" className="font-semibold underline">Ir ao login</a></p>}
      {ready && user?.accountType === "GUEST" && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">O ambiente Guest é compartilhado. Entre com uma conta pessoal para criar sua equipe.</p>}
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
      {ready && user?.accountType === "USER" && token && <>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <TeamMemberPicker token={token} apiBase={API_BASE} members={members} onAdded={add} onRemove={setPendingRemove} disabled={busy} />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Membros ({members.length})</h2>
          {!members.length && <p className="mt-4 text-sm text-slate-500">Nenhum membro adicionado ainda.</p>}
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-700">
            {members.map(member => <li key={member.id} className="flex items-center justify-between gap-3 py-4">
              <div><p className="font-semibold">{member.name}</p><p className="text-sm text-slate-500">@{member.username}</p></div>
              <button type="button" disabled={busy} onClick={() => setPendingRemove(member)}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40 dark:text-red-300">Remover</button>
            </li>)}
          </ul>
        </section>
        <p className="text-xs text-slate-500">Membros adicionados ficam disponíveis para atribuir tarefas nos seus workspaces. Isso não concede acesso aos projetos, que continuam privados. Reatribua as tarefas antes de remover alguém.</p>
      </>}
    </div>
    {pendingRemove && <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/75 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby="team-confirm-heading" className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-950 dark:bg-slate-900 dark:text-white">
        <h2 id="team-confirm-heading" className="text-xl font-bold">Remover membro?</h2>
        <p className="mt-3 text-sm">Remover <strong>{pendingRemove.name}</strong> da sua equipe? A conta dessa pessoa não será excluída.</p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={() => setPendingRemove(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
          <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Removendo..." : "Remover membro"}</button>
        </div>
      </section>
    </div>}
  </main>;
}
