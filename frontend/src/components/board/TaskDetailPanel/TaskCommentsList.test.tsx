import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TaskCommentsList } from "./TaskCommentsList";

describe("exclusão contextual de comentários", () => {
  const comments = [{ id: "c1", authorId: "user-1", createdAt: "2026-10-26T12:00:00Z", message: "Comentário de teste" }];
  const members = [{ id: "user-1", name: "Ana", email: "", avatar: "", role: "admin" as const }];

  it("não remove sem confirmação; envia o ID exato após confirmar", async () => {
    const onDeleteComment = jest.fn().mockResolvedValue(true);
    render(<TaskCommentsList comments={comments} members={members} onDeleteComment={onDeleteComment} />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir comentário" }));
    expect(onDeleteComment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(onDeleteComment).toHaveBeenCalledWith("c1"));
    await waitFor(() => expect(screen.queryByText(/Excluir este comentário definitivamente/)).not.toBeInTheDocument());
  });

  it("mantém a confirmação quando o servidor recusa a exclusão", async () => {
    const onDeleteComment = jest.fn().mockResolvedValue(false);
    render(<TaskCommentsList comments={comments} members={members} onDeleteComment={onDeleteComment} />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir comentário" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(onDeleteComment).toHaveBeenCalled());
    expect(screen.getByText(/Excluir este comentário definitivamente/)).toBeInTheDocument();
  });
});
