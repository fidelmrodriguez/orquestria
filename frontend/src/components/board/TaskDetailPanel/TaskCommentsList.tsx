import { formatDate, getInitials } from "@/lib/utils";
import type { Comment, Member } from "@/types/board";

type TaskCommentsListProps = {
  comments: Comment[];
  members: Member[];
  fallbackMember?: Member;
};

export function TaskCommentsList({ comments, members, fallbackMember }: TaskCommentsListProps) {
  if (!comments.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
        Nenhum comentário registrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const author = members.find((item) => item.id === comment.authorId) || fallbackMember;

        return (
          <div key={comment.id} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                {getInitials(author?.name || "User")}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{author?.name || "User"}</p>
                <p className="text-xs text-slate-400">{formatDate(comment.createdAt)}</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{comment.message}</p>
          </div>
        );
      })}
    </div>
  );
}
