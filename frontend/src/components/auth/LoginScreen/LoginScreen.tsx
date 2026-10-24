"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useBoardStore } from "@/store/board-store";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";
import { authenticate, GUEST_IDENTIFIER, GUEST_PASSWORD } from "@/lib/auth-client";
import { isApiMode } from "@/lib/remote-board";

type AccessMode = "guest" | "personal" | "register";

export function LoginScreen() {
  const login = useBoardStore((state) => state.login);
  const { notify } = useToast();
  const [mode, setMode] = useState<AccessMode>("guest");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registering = mode === "register";
  const guest = mode === "guest";

  function changeMode(next: AccessMode) {
    if (saving) return;
    setMode(next);
    setPassword(""); // A senha de demonstração nunca deve ser reutilizada na conta pessoal.
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      if (!isApiMode) {
        login(guest ? "Guest" : name || email || "User", guest ? "guest@orquestria.demo" : email);
      } else {
        const result = registering
          ? await authenticate("register", { name, email: email.trim(), password })
          : await authenticate("login", {
              identifier: guest ? GUEST_IDENTIFIER : email.trim(),
              password: guest ? GUEST_PASSWORD : password
            });
        login(result.name, result.email, result.id);
      }
      notify("Sessão iniciada com sucesso.", "success");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Não foi possível autenticar.");
    } finally {
      setSaving(false);
    }
  }

  const title = registering ? "Criar minha conta" : guest ? "Entrar como guest" : "Entrar na minha conta";
  const subtitle = registering
    ? "Crie uma conta para ter projetos privados."
    : guest
      ? "As credenciais públicas da demonstração já estão preenchidas."
      : "Use o e-mail e a senha informados no cadastro.";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,.16),_transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff)] p-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:p-8">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 shadow-card dark:bg-slate-950/70 dark:text-slate-300">
            <ShieldCheck className="size-4" /> Ambiente de demonstração e contas individuais
          </div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Gestão de projetos com quadro, prioridades e organização de tarefas.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Entre como guest para explorar um quadro compartilhado ou crie sua conta para ter projetos privados.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[["Projetos", "Frentes organizadas por workspace"], ["Kanban", "Movimente tarefas entre etapas"], ["Contas", "Dados privados para quem se cadastrar"]].map(([itemTitle, description]) => (
              <div key={itemTitle} className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-card dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-sm font-semibold">{itemTitle}</p>
                <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={(event) => void submit(event)} className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950/90 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
          <div className="space-y-4">
            {registering && (
              <label className="block space-y-2">
                <span className="text-sm font-medium">Nome</span>
                <input className="field" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} autoComplete="name" disabled={saving} />
              </label>
            )}
            {guest ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium">Usuário de demonstração</span>
                <input className="field" value={GUEST_IDENTIFIER} readOnly autoComplete="off" />
              </label>
            ) : (
              <label className="block space-y-2">
                <span className="text-sm font-medium">E-mail {registering ? "" : "cadastrado"}</span>
                <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={190} autoComplete="email" disabled={saving} />
              </label>
            )}
            <label className="block space-y-2">
              <span className="text-sm font-medium">Senha</span>
              <input
                className="field" type="password" value={guest ? GUEST_PASSWORD : password}
                onChange={guest ? undefined : (event) => setPassword(event.target.value)}
                readOnly={guest} disabled={saving} required minLength={registering ? 10 : 1}
                maxLength={100} autoComplete={guest ? "off" : registering ? "new-password" : "current-password"}
              />
            </label>
            {!guest && !registering && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O login utiliza o e-mail informado no cadastro, não o nome de exibição.
              </p>
            )}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>
          <button type="submit" disabled={saving} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:shadow-card disabled:opacity-60 dark:bg-white dark:text-slate-950">
            {saving ? "Conectando..." : registering ? "Criar conta e entrar" : guest ? "Acessar demonstração" : "Entrar na minha conta"} <ArrowRight className="size-4" />
          </button>
          <div className="mt-5 space-y-3 text-center text-sm font-medium">
            {guest ? (
              <>
                <button type="button" disabled={saving} onClick={() => changeMode("personal")} className="block w-full text-blue-700 underline underline-offset-4 disabled:opacity-60 dark:text-blue-300">Já tenho uma conta</button>
                <button type="button" disabled={saving} onClick={() => changeMode("register")} className="block w-full text-blue-700 underline underline-offset-4 disabled:opacity-60 dark:text-blue-300">Criar minha conta</button>
              </>
            ) : (
              <>
                {registering ? (
                  <button type="button" disabled={saving} onClick={() => changeMode("personal")} className="block w-full text-blue-700 underline underline-offset-4 disabled:opacity-60 dark:text-blue-300">Já tenho uma conta</button>
                ) : (
                  <button type="button" disabled={saving} onClick={() => changeMode("register")} className="block w-full text-blue-700 underline underline-offset-4 disabled:opacity-60 dark:text-blue-300">Criar minha conta</button>
                )}
                <button type="button" disabled={saving} onClick={() => changeMode("guest")} className="block w-full text-blue-700 underline underline-offset-4 disabled:opacity-60 dark:text-blue-300">Voltar ao guest</button>
              </>
            )}
          </div>
          {guest && <p className="mt-3 text-center text-xs text-slate-500">Guest é uma conta pública e compartilhada. Não use informações pessoais.</p>}
        </form>
      </section>
    </main>
  );
}
