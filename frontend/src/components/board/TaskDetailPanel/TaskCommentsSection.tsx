import { MessageCircle } from "lucide-react";
import type { Member, Task } from "@/types/board";
import { TaskCommentForm } from "./TaskCommentForm";
import { TaskCommentsList } from "./TaskCommentsList";

type TaskCommentsSectionProps = {
  task: Task;
  members: Member[];
  fallbackMember?: Member;
  onSubmitComment: (message: string) => void;
};

export function TaskCommentsSection({ task, members, fallbackMember, onSubmitComment }: TaskCommentsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <MessageCircle className="size-4" /> Comentários
      </div>
      <TaskCommentForm onSubmitComment={onSubmitComment} />
      <TaskCommentsList comments={task.comments} members={members} fallbackMember={fallbackMember} />
    </section>
  );
}
