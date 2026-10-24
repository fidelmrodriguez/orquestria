import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authenticate } from "@/lib/auth-client";
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
  authenticate: jest.fn()
}));
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
const sampleUser = {
  token: "token-de-teste", id: "user-123", name: "Pessoa Teste",
  email: "pessoa@exemplo.com", accountType: "USER" as const,
  expiresAt: "2026-11-01T00:00:00Z"
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticate.mockResolvedValue(sampleUser);
});

describe("LoginScreen", () => {
  it("mantém o guest pré-preenchido sem misturar a senha com a conta pessoal", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    expect(screen.getByLabelText("Usuário ou e-mail")).toHaveValue("guest");
    expect(screen.getByLabelText("Senha")).toHaveValue("OrquestriaDemo2026!");
    await user.click(screen.getByRole("button", { name: "Já tenho uma conta" }));
    expect(screen.getByLabelText("E-mail cadastrado")).toHaveValue("");
    expect(screen.getByLabelText("Senha")).toHaveValue("");

    await user.type(screen.getByLabelText("E-mail cadastrado"), "pessoa@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "MinhaSenhaSegura123!");
    await user.click(screen.getByRole("button", { name: "Entrar na minha conta" }));
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledWith("login", {
        identifier: "pessoa@exemplo.com", password: "MinhaSenhaSegura123!"
      });
    });
    expect(mockLogin).toHaveBeenCalledWith("Pessoa Teste", "pessoa@exemplo.com", "user-123");
  });

  it("cria a conta e autentica automaticamente usando a senha cadastrada", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }));
    await user.type(screen.getByLabelText("Nome"), "Pessoa Teste");
    await user.type(screen.getByLabelText("E-mail"), "pessoa@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "MinhaSenhaSegura123!");
    await user.click(screen.getByRole("button", { name: "Criar conta e entrar" }));
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledWith("register", {
        name: "Pessoa Teste", email: "pessoa@exemplo.com", password: "MinhaSenhaSegura123!"
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

    await user.click(screen.getByRole("button", { name: "Entrar com estas credenciais" }));
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
    await user.click(screen.getByRole("button", { name: "Já tenho uma conta" }));
    await user.click(screen.getByRole("button", { name: "Voltar ao guest" }));
    expect(screen.getByLabelText("Usuário ou e-mail")).toHaveValue("guest");
    expect(screen.getByLabelText("Senha")).toHaveValue("OrquestriaDemo2026!");
  });
});
