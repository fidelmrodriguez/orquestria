"use client";

import { BackToKanbanLink } from "@/components/navigation/BackToKanbanLink";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAuthToken, restoreAuthSession, type AuthUser } from "@/lib/auth-client";
import { ChevronDown } from "lucide-react";
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
    if (response.status === 409) throw new Error(method === "POST" && path.includes("/remove") ? "Reatribua as tarefas desse membro antes de removê-lo." : "Este usuário já pertence a este projeto.");
    if (response.status === 404) throw new Error("Usuário ou membro não encontrado.");
    throw new Error(`A API recusou a operação (HTTP ${response.status}).`);
  }
  return response.status === 204 ? null as T : await response.json() as T;
}

type OwnedProject = { id: string; name: string; workspaceId: string | null };
type OwnedWorkspace = { id: string; name: string };
type ProjectMember = DirectoryUser & { role: "admin" | "membro-admin" };

export default function EquipePage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [workspaces, setWorkspaces] = useState<OwnedWorkspace[]>([]);
  const currentProjectRef = useRef("");
  const [projects, setProjects] = useState<OwnedProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [pendingRemove, setPendingRemove] = useState<DirectoryUser | null>(null);

  const refresh = useCallback(async (accessToken: string, selectedProject: string) => {
    currentProjectRef.current = selectedProject;
    setMembers([]);
    if (!selectedProject) return;
    const list = await teamRequest<ProjectMember[]>(accessToken, `/api/projects/${selectedProject}/members`);
    if (!Array.isArray(list) || !list.length) throw new Error("A API não retornou o proprietário do projeto. Confira a publicação do backend com Flyway V10.");
    // Uma resposta atrasada de outro projeto não pode substituir seus participantes.
    if (currentProjectRef.current === selectedProject) setMembers(list);
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const account = await restoreAuthSession();
        if (!live) return;
        const accessToken = getAuthToken();
        setUser(account); setToken(account && accessToken ? accessToken : null);
        if (account?.accountType === "USER" && accessToken) {
          const [owned, ownedWorkspaces] = await Promise.all([
            teamRequest<OwnedProject[]>(accessToken, "/api/projects"),
            teamRequest<OwnedWorkspace[]>(accessToken, "/api/workspaces")
          ]);
          if (!live) return;
          setProjects(owned);
          setWorkspaces(ownedWorkspaces);
          const requested = new URLSearchParams(window.location.search).get("projectId");
          const selected = owned.find(p => p.id === requested)?.id || owned[0]?.id || "";
          setProjectId(selected);
          await refresh(accessToken, selected);
        }
      } catch (cause) {
        if (live) setError(cause instanceof Error ? cause.message : "Não foi possível carregar a equipe.");
      } finally { if (live) setReady(true); }
    })();
    return () => { live = false; };
  }, [refresh]);

  async function add(member: DirectoryUser) {
    if (!token || !projectId || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await teamRequest(token, `/api/projects/${projectId}/members`, "POST", { userId: member.id });
      await refresh(token, projectId);
      setNotice(`${member.name} agora pode acessar este projeto como membro-admin.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao adicionar membro.");
      throw cause;
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!token || !projectId || !pendingRemove || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await teamRequest(token, `/api/projects/${projectId}/members/${encodeURIComponent(pendingRemove.id)}/remove`, "POST");
      await refresh(token, projectId);
      setNotice(`Acesso de ${pendingRemove.name} revogado neste projeto.`);
      setPendingRemove(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover membro.");
    } finally { setBusy(false); }
  }

  const selectedProject = projects.find(project => project.id === projectId);
  const selectedWorkspaceName = selectedProject?.workspaceId
    ? workspaces.find(workspace => workspace.id === selectedProject.workspaceId)?.name || "Workspace não encontrado"
    : "Projetos sem workspace";
  const invitedMembers = members.filter(member => member.role === "membro-admin");

  return <main className="min-h-screen bg-slate-50 px-4 py-9 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
    <div className="mx-auto max-w-3xl space-y-7">
      <BackToKanbanLink />
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">Orquestria</p>
        <h1 className="text-3xl font-bold">Equipe</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Selecione um projeto e adicione usuários cadastrados. A pessoa terá acesso imediato como membro-admin somente ao projeto escolhido. Para remover, reatribua suas tarefas primeiro.</p>
      </header>
      {!ready && <p role="status">Carregando sua equipe...</p>}
      {ready && !user && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">Faça login para gerenciar a equipe. <a href="/" className="font-semibold underline">Ir ao login</a></p>}
      {ready && user?.accountType === "GUEST" && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">O ambiente Guest é compartilhado. Entre com uma conta pessoal para criar sua equipe.</p>}
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">{notice}</p>}
      {ready && user?.accountType === "USER" && token && <>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label htmlFor="team-project" className="mb-2 block text-sm font-semibold">Projeto que será compartilhado</label>
          <div className="relative">
          <select id="team-project" value={projectId} disabled={busy} onChange={event => {
            setProjectId(event.target.value); setPendingRemove(null); setNotice(""); setError("");
            if (token) void refresh(token, event.target.value).catch(cause => setError(cause instanceof Error ? cause.message : "Falha ao carregar membros."));
          }} className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-12 text-sm dark:border-slate-700 dark:bg-slate-950">
            {!projects.length && <option value="">Crie um projeto antes de adicionar membros</option>}
            {projects.map(project => <option key={project.id} value={project.id}>{project.workspaceId
              ? workspaces.find(workspace => workspace.id === project.workspaceId)?.name || "Workspace não encontrado"
              : "Projetos sem workspace"} / {project.name}</option>)}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          </div>
          {selectedProject && <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-950">
            <p><span className="font-semibold">Workspace:</span> {selectedWorkspaceName}</p>
            <p className="mt-1"><span className="font-semibold">Projeto:</span> {selectedProject.name}</p>
          </div>}
          <p className="mt-2 text-xs text-slate-500">O membro verá somente este projeto em Workspaces convidados; outros projetos do mesmo workspace continuam privados.</p>
        </section>
        {Boolean(projectId) && <><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <TeamMemberPicker key={projectId} token={token} apiBase={API_BASE} members={invitedMembers} onAdded={add} onRemove={setPendingRemove} disabled={busy} />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Participantes do projeto ({members.length})</h2>
          {!members.length && <p className="mt-4 text-sm text-slate-500">Nenhum participante carregado para este projeto.</p>}
          {members.length === 1 && <p className="mt-2 text-sm text-slate-500">Somente o proprietário participa deste projeto. Pesquise um usuário acima para compartilhar o acesso.</p>}
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-700">
            {members.map(member => <li key={member.id} className="flex items-center justify-between gap-3 py-4">
              <div><p className="font-semibold">{member.name} <span className="ml-2 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{member.role}</span></p><p className="mt-1 text-sm text-slate-500">@{member.username}</p></div>
              {member.role === "membro-admin" && <button type="button" disabled={busy} onClick={() => setPendingRemove(member)}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40 dark:text-red-300">Remover</button>}
            </li>)}
          </ul>
        </section>
        <p className="text-xs text-slate-500">Admin: proprietário. Membro-admin: pode administrar tarefas, colunas e projeto compartilhado, mas não adicionar nem remover pessoas. O vínculo não inclui outros projetos do workspace.</p>
        </>}
      </>}
    </div>
    {pendingRemove && <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/75 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby="team-confirm-heading" className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-950 dark:bg-slate-900 dark:text-white">
        <h2 id="team-confirm-heading" className="text-xl font-bold">Remover membro?</h2>
        <p className="mt-3 text-sm">Revogar o acesso de <strong>{pendingRemove.name}</strong> a este projeto? A conta da pessoa e os demais projetos não serão alterados.</p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={() => setPendingRemove(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
          <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Removendo..." : "Remover membro"}</button>
        </div>
      </section>
    </div>}
  </main>;
}
