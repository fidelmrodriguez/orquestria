import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authenticate, getAuthToken, restoreAuthSession } from "@/lib/auth-client";
import { LoginScreen } from "@/components/auth/LoginScreen/LoginScreen";

const mockLogin = jest.fn();
const mockNotify = jest.fn();
jest.mock("@/store/board-store", () => ({
  useBoardStore: (select: (state: { login: typeof mockLogin }) => unknown) => select({ login: mockLogin })
}));
jest.mock("@/components/feedback/ToastProvider/ToastProvider", () => ({
  useToast: () => ({ notify: mockNotify })
}));
jest.mock("@/lib/remote-board", () => ({ isApiMode: true }));
jest.mock("@/lib/auth-client", () => ({
  GUEST_IDENTIFIER: "guest",
  GUEST_PASSWORD: "OrquestriaDemo2026!",
  authenticate: jest.fn(),
  getAuthToken: jest.fn(),
  restoreAuthSession: jest.fn()
}));
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
const mockToken = getAuthToken as jest.MockedFunction<typeof getAuthToken>;
const mockRestore = restoreAuthSession as jest.MockedFunction<typeof restoreAuthSession>;
const sampleUser = {
  token: "token-de-teste", id: "user-123", name: "Pessoa Teste",
  email: "pessoa@exemplo.com", accountType: "USER" as const,
  expiresAt: "2026-11-01T00:00:00Z"
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticate.mockResolvedValue(sampleUser);
  mockToken.mockReturnValue(null);
  mockRestore.mockResolvedValue(null);
});

describe("LoginScreen", () => {
  it("restaura a conta após F5 validando /me sem solicitar novo login", async () => {
    mockToken.mockReturnValue("token-de-teste");
    mockRestore.mockResolvedValue({
      id: "user-123", name: "Pessoa Teste", email: "pessoa@exemplo.com", accountType: "USER"
    });
    render(<LoginScreen />);
    expect(screen.getByRole("status")).toHaveTextContent("Restaurando sua sessão");
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("Pessoa Teste", "pessoa@exemplo.com", "user-123"));
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it("exibe novamente o formulário quando /me identifica sessão expirada", async () => {
    mockToken.mockReturnValue("token-vencido");
    mockRestore.mockResolvedValue(null);
    render(<LoginScreen />);
    expect(await screen.findByRole("button", { name: "Acessar demonstração" })).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("mantém o guest pré-preenchido sem misturar a senha com a conta pessoal", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    expect(screen.getByLabelText("Usuário ou e-mail")).toHaveValue("guest");
    expect(screen.getByLabelText("Senha")).toHaveValue("OrquestriaDemo2026!");
    await user.click(screen.getByRole("button", { name: "Já tenho uma conta" }));
    expect(screen.getByLabelText("Usuário ou e-mail")).toHaveValue("");
    expect(screen.getByLabelText("Senha")).toHaveValue("");

    await user.type(screen.getByLabelText("Usuário ou e-mail"), "pessoa@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "MinhaSenhaSegura123!");
    await user.click(screen.getByRole("button", { name: "Entrar na minha conta" }));
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledWith("login", {
        identifier: "pessoa@exemplo.com", password: "MinhaSenhaSegura123!"
      });
    });
    expect(mockLogin).toHaveBeenCalledWith("Pessoa Teste", "pessoa@exemplo.com", "user-123");
  });

  it("permite entrar na conta pessoal pelo nome de usuário", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole("button", { name: "Já tenho uma conta" }));
    await user.type(screen.getByLabelText("Usuário ou e-mail"), "pessoa.teste");
    await user.type(screen.getByLabelText("Senha"), "MinhaSenhaSegura123!");
    await user.click(screen.getByRole("button", { name: "Entrar na minha conta" }));
    await waitFor(() => expect(mockAuthenticate).toHaveBeenCalledWith("login", {
      identifier: "pessoa.teste", password: "MinhaSenhaSegura123!"
    }));
  });
  it("cria a conta e autentica automaticamente usando a senha cadastrada", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }));
    await user.type(screen.getByLabelText("Nome de exibição"), "Pessoa Teste");
    await user.type(screen.getByLabelText("Nome de usuário"), "pessoa.teste");
    await user.type(screen.getByLabelText("E-mail"), "pessoa@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "MinhaSenhaSegura123!");
    await user.click(screen.getByRole("button", { name: "Criar conta e entrar" }));
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledWith("register", {
        name: "Pessoa Teste", username: "pessoa.teste", email: "pessoa@exemplo.com", password: "MinhaSenhaSegura123!"
      });
    });
    expect(mockLogin).toHaveBeenCalledWith("Pessoa Teste", "pessoa@exemplo.com", "user-123");
  });

  it("envia as credenciais públicas originais ao entrar como guest sem editar os campos", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole("button", { name: "Acessar demonstração" }));
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledWith("login", {
        identifier: "guest", password: "OrquestriaDemo2026!"
      });
    });
  });

  it("permite Backspace nos dois campos e autentica com as credenciais editadas", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const identifier = screen.getByLabelText("Usuário ou e-mail");
    const password = screen.getByLabelText("Senha");

    await user.click(identifier);
    await user.keyboard("{End}{Backspace}");
    expect(identifier).toHaveValue("gues");
    await user.clear(identifier);
    await user.type(identifier, "pessoa@exemplo.com");

    await user.click(password);
    await user.keyboard("{End}{Backspace}");
    expect(password).toHaveValue("OrquestriaDemo2026");
    await user.clear(password);
    await user.type(password, "MinhaSenhaSegura123!");

    await user.click(screen.getByRole("button", { name: "Entrar na minha conta" }));
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledWith("login", {
        identifier: "pessoa@exemplo.com", password: "MinhaSenhaSegura123!"
      });
    });
  });

  it("restaura as credenciais guest ao voltar do formulário da conta pessoal", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.clear(screen.getByLabelText("Usuário ou e-mail"));
    await user.type(screen.getByLabelText("Usuário ou e-mail"), "outro@exemplo.com");
    expect(screen.getByRole("button", { name: "Entrar na minha conta" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Voltar ao guest" }));
    expect(screen.getByLabelText("Usuário ou e-mail")).toHaveValue("guest");
    expect(screen.getByLabelText("Senha")).toHaveValue("OrquestriaDemo2026!");
  });
  it("troca imediatamente para login pessoal ao editar o usuário guest e volta ao restaurar", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const identifier = screen.getByLabelText("Usuário ou e-mail");
    expect(screen.getByRole("heading", { name: "Entrar como guest" })).toBeInTheDocument();
    await user.type(identifier, "x");
    expect(identifier).toHaveValue("guestx");
    expect(identifier).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Entrar na minha conta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar na minha conta" })).toBeInTheDocument();

    await user.keyboard("{Backspace}");
    expect(identifier).toHaveValue("guest");
    expect(identifier).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Entrar como guest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acessar demonstração" })).toBeInTheDocument();
  });

  it("troca imediatamente para login pessoal ao editar a senha guest e volta ao restaurar", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const password = screen.getByLabelText("Senha");
    await user.type(password, "x");
    expect(password).toHaveValue("OrquestriaDemo2026!x");
    expect(password).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Entrar na minha conta" })).toBeInTheDocument();
    await user.keyboard("{Backspace}");
    expect(password).toHaveValue("OrquestriaDemo2026!");
    expect(password).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Entrar como guest" })).toBeInTheDocument();
  });

  it("só retorna ao guest quando usuário e senha originais são restaurados", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const identifier = screen.getByLabelText("Usuário ou e-mail");
    const password = screen.getByLabelText("Senha");
    await user.type(identifier, "x");
    await user.type(password, "y");
    await user.click(identifier);
    await user.keyboard("{End}{Backspace}");
    expect(identifier).toHaveValue("guest");
    expect(screen.getByRole("heading", { name: "Entrar na minha conta" })).toBeInTheDocument();
    await user.click(password);
    await user.keyboard("{End}{Backspace}");
    expect(password).toHaveValue("OrquestriaDemo2026!");
    expect(screen.getByRole("heading", { name: "Entrar como guest" })).toBeInTheDocument();
  });

});


describe("prioridade do formulário no mobile", () => {
  it("mostra o login antes do conteúdo institucional, preservando a ordem desktop", async () => {
    const { container } = render(<LoginScreen />);
    await screen.findByRole("button", { name: "Acessar demonstração" });
    const form = container.querySelector("form");
    const marketing = screen.getByRole("heading", { name: /Gestão de projetos com quadro/i }).parentElement?.parentElement;
    expect(form).toHaveClass("order-1", "lg:order-2");
    expect(marketing).toHaveClass("order-2", "lg:order-1");
    expect(container.querySelector("section")).toHaveClass("lg:grid-cols-[1.05fr_.95fr]");
  });
});


describe("textos de apoio do login", () => {
  it("mantém descrições curtas para guest e conta pessoal em qualquer resolução", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    expect(screen.getByText("Use os dados de demonstração ou edite os campos.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Já tenho uma conta" }));
    expect(screen.getByText("Entre com seu usuário ou e-mail e senha.")).toBeInTheDocument();
  });
});


describe("contraste do login nos dois temas", () => {
  it("remove o gradiente claro no modo escuro sem adicionar botão de tema", () => {
    const { container } = render(<LoginScreen />);
    const main = container.querySelector("main");
    expect(main).toHaveClass("dark:bg-none", "dark:bg-slate-950");
    expect(screen.getByRole("heading", { name: "Entrar como guest" }).closest("form"))
      .toHaveClass("dark:bg-slate-900");
    expect(screen.queryByRole("button", { name: "Alternar tema" })).not.toBeInTheDocument();
  });
});
