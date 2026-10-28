import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { commentSchema, type CommentForm } from "./task-detail-schema";

type TaskCommentFormProps = {
  onSubmitComment: (message: string) => void;
};

export function TaskCommentForm({ onSubmitComment }: TaskCommentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CommentForm>({ resolver: zodResolver(commentSchema), defaultValues: { message: "" } });

  const submit = (values: CommentForm) => {
    onSubmitComment(values.message);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="rounded-3xl border border-slate-200 bg-slate-50 p-3 transition-colors focus-within:border-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:focus-within:border-slate-600">
      <textarea
        {...register("message")}
        placeholder="Escreva uma atualização para a equipe"
        className="orquestria-inset-field min-h-24 w-full resize-none border-0 bg-transparent p-2 text-sm outline-none placeholder:text-slate-400"
      />
      {errors.message && <p className="px-2 text-sm text-red-500">{errors.message.message}</p>}
      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
          <Send className="size-4" /> Enviar
        </button>
      </div>
    </form>
  );
}
