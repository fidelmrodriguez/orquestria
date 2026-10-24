"use client";

import { FormEvent, useState } from "react";

type Projeto = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

const apiUrl = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL ?? "").trim().replace(/\/$/, "");

export default function DiagnosticoPage() {
  const [health, setHealth] = useState("Ainda não testado");
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function parseJson(res: Response): Promise<unknown> {
    const raw = await res.text();
    try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
  }

  async function check() {
    if (!apiUrl) return;
    setBusy(true);
    setMessage("");
    try {
      console.info("[Orquestria] Verificando saúde da API", apiUrl);
      const statusResponse = await fetch(`${apiUrl}/actuator/health`, { cache: "no-store" });
      const statusData = await parseJson(statusResponse);
      if (!statusResponse.ok) throw new Error(`Health HTTP ${statusResponse.status}`);
      setHealth(JSON.stringify(statusData));

      console.info("[Orquestria] Consultando projetos");
      const projectsResponse = await fetch(`${apiUrl}/api/projects`, { cache: "no-store" });
      const projectsData = await parseJson(projectsResponse);
      if (!projectsResponse.ok || !Array.isArray(projectsData)) {
        throw new Error(`Projetos HTTP ${projectsResponse.status}`);
      }
      setProjects(projectsData as Projeto[]);
      setMessage(`API respondendo; ${projectsData.length} projeto(s) retornado(s).`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[Orquestria] Falha na verificação da API:", detail);
      setHealth("Falha ao verificar a API");
      setMessage(`${detail}. Verifique a URL, o CORS e os logs do Render.`);
    } finally { setBusy(false); }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiUrl || !name.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      console.info("[Orquestria] Criando um projeto de teste");
      const response = await fetch(`${apiUrl}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: "Criado pela página de diagnóstico do frontend" }),
      });
      const body = await parseJson(response);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
      setName("");
      setMessage("Projeto de teste salvo no PostgreSQL. Clique em Verificar conexão para conferir.");
      console.info("[Orquestria] Projeto criado:", body);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[Orquestria] Erro ao criar projeto:", detail);
      setMessage(detail);
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-slate-900">
      <a className="text-sm underline" href="/">Voltar ao Orquestria</a>
      <h1 className="mt-6 text-3xl font-semibold">Diagnóstico da API</h1>
      <p className="mt-3 text-slate-600">Página temporária para verificar a comunicação entre o frontend no Netlify e o backend Java no Render.</p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Endereço configurado da API</p>
        <p className="mt-1 break-all font-mono text-sm">{apiUrl || "Não configurado. Defina NEXT_PUBLIC_ORQUESTRIA_API_URL no Netlify e faça novo deploy."}</p>
        <p className="mt-4 text-sm"><strong>Saúde:</strong> {health}</p>
        <button className="mt-4 rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-40" disabled={!apiUrl || busy} onClick={check} type="button">
          {busy ? "Aguarde..." : "Verificar conexão e listar projetos"}
        </button>
        {message && <p aria-live="polite" className="mt-4 text-sm text-slate-700">{message}</p>}
      </div>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Criar projeto de teste</h2>
        <p className="mt-2 text-sm text-slate-600">Esta API ainda não tem autenticação. Use somente dados fictícios; esta página é temporária.</p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={createProject}>
          <input aria-label="Nome do projeto" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" maxLength={120} onChange={e => setName(e.target.value)} placeholder="Ex.: Projeto de demonstração" value={name}/>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" disabled={!apiUrl || busy || !name.trim()} type="submit">Salvar no PostgreSQL</button>
        </form>
        <h3 className="mt-6 font-semibold">Projetos retornados pela API</h3>
        {projects.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nenhum projeto carregado.</p> : (
          <ul className="mt-2 divide-y divide-slate-200">
            {projects.map(project => <li className="py-3" key={project.id}>
              <span className="font-medium">{project.name}</span>
              <p className="break-all font-mono text-xs text-slate-500">{project.id}</p>
            </li>)}
          </ul>
        )}
      </div>
      <p className="mt-6 text-sm text-slate-500">O quadro Kanban principal ainda utiliza dados demonstrativos. Esta página testa somente a API de projetos.</p>
    </main>
  );
}
