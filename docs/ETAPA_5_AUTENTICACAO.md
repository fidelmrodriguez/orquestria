# Etapa 5 — Autenticação real e contas independentes
## Implementação

O Orquestria passa a autenticar acessos com **Spring Security** e senhas protegidas por **BCrypt**. O frontend usa um token de sessão aleatório que o backend guarda apenas como SHA-256 no PostgreSQL. Cada login cria uma sessão independente, válida por 7 dias. `POST /api/auth/logout` revoga somente a sessão atual.
A API exige `Authorization: Bearer <token>` nas rotas `/api/workspaces`, `/api/projects`, `/api/projects/{id}/columns`, `/api/projects/{id}/tasks` e subrotas. As exceções são `/api/auth/login`, `/api/auth/register` e `/actuator/health`. A página `/diagnostico/` também utiliza o token do usuário logado.
### Guest
- O guest é uma conta no banco (`account_type = GUEST`) com identificador persistente, email `guest@orquestria.demo` e apelido `guest` no login.
- A tela de entrada traz os campos preenchidos com credenciais públicas de demonstração.
- Várias pessoas podem entrar ao mesmo tempo: cada navegador recebe sua própria sessão, mas **todas compartilham os dados do guest**.
- A migração V4 e o bootstrap atribuem os projetos e workspaces antigos à conta guest, preservando as tarefas e comentários existentes.
- A conta guest não tem opção de exclusão. Nenhuma rotina automática de limpeza foi adicionada.
### Contas cadastradas

- Cadastro com nome de exibição, nome de usuário único, e-mail e senha (mínimo de dez caracteres).
- Ao entrar, cada conta consulta somente seus projetos e workspaces.
- Tentativas de ler ou modificar projetos de outras contas retornam `404` sem revelar os dados.
- Nesta etapa não há convite, compartilhamento entre contas, recuperação de senha ou exclusão de conta. Essas funcionalidades ficam para fases posteriores.
## Migração V4

`V4__accounts_and_ownership.sql` adiciona `app_users`, `auth_sessions` e `owner_id` a `projects` e `workspaces`. Os relacionamentos anteriores de colunas, tarefas e comentários são preservados. Na primeira inicialização, `GuestBootstrap` cria o guest (se ainda não existir) e atribui a ele os registros anteriores sem proprietário.

**Não edite V1–V3**, que já foram aplicadas no Neon. Não remova V4 depois de publicada.
## Deploy sem instalação local
1. Publique o commit com frontend e backend no GitHub.
2. No Blitz, faça o build Java e confirme a migração V4. `DB_URL`, `DB_USER` e `DB_PASSWORD` continuam os mesmos.
3. O backend tem senha guest de demonstração padrão `OrquestriaDemo2026!`. Se definir `APP_GUEST_PASSWORD` no Blitz **antes do primeiro bootstrap**, atualize também a senha pré-preenchida no frontend. Depois da criação do guest, mudar a variável não altera a senha existente automaticamente.
4. Aguarde o deploy do Netlify e teste login como guest; depois cadastre uma conta nova e comprove que ela não consegue consultar o quadro do guest.
5. Confira que F5 mantém a sessão na mesma aba e que o logout volta ao formulário.
**Segurança:** o token é guardado em `sessionStorage` no navegador, não em `localStorage`; ainda exige cuidado com XSS. O guest é público, portanto não coloque dados pessoais nele. Contas reais permanecem privadas na API, mas o projeto ainda não tem recuperação de senha, proteção abrangente contra abuso ou compartilhamentos avançados.
## Testes recomendados

- `POST /api/auth/login` com guest → token.
- `GET /api/projects` com token guest → registros anteriores.
- `GET /api/projects` sem token → HTTP `401`.
- Registrar outra conta → projetos vazios. Criar projeto nessa conta → visível apenas para ela.
- Tentar acessar UUID de projeto guest com token da conta criada → HTTP `404`.
- Entrar no guest em dois navegadores → duas sessões válidas, mesmos projetos.
- `POST /api/auth/logout` → o token antigo deixa de acessar a API.
## Fora desta entrega

Sem limpeza automática, exclusão de usuários, agendador, remoção de registros antigos ou alterações de quotas. A manutenção automática segue reservada para a Etapa 8 em commit separado. A conta guest será permanentemente protegida nessa futura política.
## Ajuste de usabilidade do login (Etapa 5)
- O formulário separa **Entrar como guest**, **Já tenho uma conta** e **Criar minha conta**. O guest continua com credenciais públicas preenchidas por padrão.
- A autenticação das contas pessoais aceita **nome de usuário único ou e-mail cadastrado** (o nome de exibição é independente). O modo pessoal começa com a senha vazia, impedindo que a senha pré-preenchida do guest seja enviada para outra conta por engano.
- Após o cadastro, o usuário continua entrando automaticamente. Depois do logout, seleciona **Já tenho uma conta** e informa seu usuário ou e-mail e a senha para entrar novamente.
- O console registra somente a operação (`login`/`register`), o status HTTP e o resultado da requisição, sem imprimir e-mails, senhas, tokens ou conteúdo da resposta. Se o login pessoal ainda falhar, o código HTTP permite diferenciar credenciais rejeitadas (`401`) de falhas de servidor.
- A correção inicial de usabilidade não trouxe migrações; a extensão para nomes de usuário é documentada abaixo.

### Correção: campos guest editáveis
- O formulário inicial ainda exibe as credenciais públicas do guest, mas **usuário/e-mail e senha são campos editáveis**, inclusive com Backspace.
- O login usa os valores efetivamente digitados. Se o visitante substituir o guest pelo e-mail e senha de uma conta cadastrada, a API tentará autenticar essa conta, sem encaminhar as constantes do guest.
- O botão muda de **Acessar demonstração** para **Entrar com estas credenciais** quando qualquer campo é modificado. A opção **Já tenho uma conta** continua separada e inicia com senha vazia.
- **Voltar ao guest** restaura as credenciais públicas padrão para facilitar novas demonstrações.
- Testes automatizados cobrem o preenchimento inicial, Backspace, troca de credenciais, troca de modo e login pessoal.
- Esta entrega altera somente a interface, seus testes e a documentação: não exige alteração no Spring Boot, no Neon ou nas migrações.

## Login por nome de usuário ou e-mail — V5

- Novos cadastros pedem **nome de exibição** e **nome de usuário** (3–32 caracteres: letras, números, `.`, `_` ou `-`, começando com letra ou número); nomes de usuário não distinguem maiúsculas de minúsculas. `guest` é reservado.
- `POST /api/auth/login` aceita `identifier` com **e-mail completo** ou **nome de usuário**, com a mesma senha de sempre. A resposta pública continua genérica (`401`) quando o login não é autorizado.
- `V5__unique_usernames.sql` acrescenta `app_users.username`, preenche os registros existentes a partir dos nomes já cadastrados quando forem únicos e válidos para login, e cria índice exclusivo ignorando maiúsculas de minúsculas.
- Quando existirem nomes de exibição repetidos entre contas antigas, a conta mais recente mantém esse nome como usuário e as demais ganham identificador estável baseado no UUID. Nomes antigos reservados, vazios ou com `@` também ganham um identificador alternativo; todos continuam entrando por e-mail. O campo `name` original não é alterado. Nenhum projeto, sessão, token ou hash de senha é apagado.
- **Aplique a nova V5 após a V4**. Não altere migrações antigas. Confirme no Blitz `Successfully validated 5 migrations` e `Schema ... is now at version 5` antes de testar a interface no Netlify.
- Teste: entrar como guest, entrar em conta antiga por usuário e por e-mail, sair/entrar novamente; registrar conta com nome de exibição diferente do usuário; impedir cadastro com nome de usuário duplicado.
- Os logs de autenticação não devem registrar nome de usuário, e-mail, senha nem token.
