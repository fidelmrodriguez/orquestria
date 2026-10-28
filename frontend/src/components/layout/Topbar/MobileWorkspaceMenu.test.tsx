import { fireEvent, render, screen } from "@testing-library/react";
import { MobileWorkspaceMenu } from "./MobileWorkspaceMenu";

jest.mock("@/components/layout/Sidebar/Sidebar", () => ({
  Sidebar: ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav aria-label="Projetos do menu">
      <button type="button" onClick={onNavigate}>Abrir projeto</button>
    </nav>
  )
}));

jest.mock("./TopbarFilters", () => ({
  TopbarFilters: () => <div data-testid="filtros-do-menu">Filtros</div>
}));

const props = {
  open: true,
  workspace: null,
  projectId: null,
  priorityFilter: "todas" as const,
  assigneeFilter: "todos" as const,
  onNavigate: jest.fn(),
  onLogout: jest.fn(),
  theme: "light" as const,
  onChangeTheme: jest.fn(),
  onPriorityChange: jest.fn(),
  onAssigneeChange: jest.fn()
};

describe("menu de navegação mobile/tablet", () => {
  beforeEach(() => {
    props.onNavigate.mockClear();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("usa portal fora do topbar e bloqueia a rolagem e o conteúdo de fundo", () => {
    const { rerender } = render(<header data-testid="topbar"><MobileWorkspaceMenu {...props} /></header>);
    const dialog = screen.getByRole("dialog", { name: "Navegação mobile" });

    expect(dialog.parentElement).toBe(document.body);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveClass("fixed", "inset-0", "h-[100dvh]", "bg-white");
    // Há um só contêiner com rolagem vertical; a barra é ocultada por CSS.
    expect(dialog.querySelector(".mobile-navigation-scroll")).toHaveClass("overflow-y-auto", "overflow-x-hidden");
    // O espaçador integra o conteúdo rolável e fica depois do botão Sair.
    const spacer = dialog.querySelector(".mobile-navigation-end-spacer");
    const logout = screen.getByRole("button", { name: "Sair" });
    expect(spacer).toBeInTheDocument();
    expect(logout).toHaveClass("min-h-12");
    expect(logout.parentElement?.nextElementSibling).toBe(spacer);
    expect(screen.getByRole("navigation", { name: "Projetos do menu" })).toBeInTheDocument();
    expect(screen.getByTestId("filtros-do-menu")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveFocus();

    rerender(<header data-testid="topbar"><MobileWorkspaceMenu {...props} open={false} /></header>);
    expect(screen.queryByRole("dialog", { name: "Navegação mobile" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("mantém a navegação por teclado dentro do painel", () => {
    render(<MobileWorkspaceMenu {...props} />);
    const close = screen.getByRole("button", { name: "Fechar menu" });
    const logout = screen.getByRole("button", { name: "Sair" });

    logout.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(logout).toHaveFocus();
  });

  it("permite navegar pelo menu, fechar pelo botão e pressionar Escape", () => {
    render(<MobileWorkspaceMenu {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir projeto" }));
    expect(props.onNavigate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Fechar menu" }));
    expect(props.onNavigate).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onNavigate).toHaveBeenCalledTimes(3);
  });
});
