import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCommentForm } from "./TaskCommentForm";

describe("formulário de comentários", () => {
  it("evita o contorno interno e continua enviando o comentário", async () => {
    const user = userEvent.setup();
    const onSubmitComment = jest.fn();
    render(<TaskCommentForm onSubmitComment={onSubmitComment} />);
    const textarea = screen.getByPlaceholderText("Escreva uma atualização para a equipe");
    expect(textarea).toHaveClass("orquestria-inset-field");
    expect(textarea.closest("form")).toHaveClass("focus-within:border-slate-400");
    await user.type(textarea, "Atualização para a equipe");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onSubmitComment).toHaveBeenCalledWith("Atualização para a equipe");
  });
});
