"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useBoardStore } from "@/store/board-store";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";

const schema = z.object({
  name: z.string().min(2, "Informe o nome do usuário."),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(4, "A senha precisa ter pelo menos 4 caracteres.")
});

type FormValues = z.infer<typeof schema>;

export function LoginScreen() {
  const login = useBoardStore((state) => state.login);
  const { notify } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "User",
      email: "user@empresa.com",
      password: "1234"
    }
  });

  const submit = (values: FormValues) => {
    login(values.name, values.email);
    notify("Sessão iniciada com sucesso.", "success");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,.16),_transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff)] p-4 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,.22),_transparent_34%),linear-gradient(135deg,#020617,#0f172a)] dark:text-white sm:p-8">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
            <ShieldCheck className="size-4" /> Ambiente demonstrativo
          </div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-6xl">
              Gestão de projetos com quadro, prioridades e organização de tarefas.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Organize projetos, tarefas e prioridades em um quadro visual. Os dados do modo Java são compartilhados nesta demonstração pública.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Projetos", "Frentes separadas por workspace"],
              ["Quadro vivo", "Arraste tarefas entre etapas"],
              ["Colaboração", "Comentários e compartilhamento"]
            ].map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
                <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(submit)} className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Entrar no painel</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Acesso demonstrativo: sem autenticação real de usuários.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Usuário</span>
              <input {...register("name")} className="field" />
              {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">E-mail</span>
              <input {...register("email")} className="field" />
              {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Senha</span>
              <input {...register("password")} type="password" className="field" />
              {errors.password && <span className="text-sm text-red-500">{errors.password.message}</span>}
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
          >
            Acessar workspace <ArrowRight className="size-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
