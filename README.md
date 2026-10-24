# Orquestria

Gestão de projetos e tarefas com workspaces, quadros Kanban e organização do trabalho em equipe.

**[Acessar o Orquestria](https://orquestria.netlify.app/)** · [Código do frontend](frontend/) · [Código do backend](backend/) · [Guia de publicação](docs/DEPLOY_NETLIFY.md)

O Orquestria começou como uma aplicação frontend em **Next.js, React e TypeScript**. Essa versão está publicada no Netlify e já permite navegar por projetos, organizar tarefas e utilizar o quadro Kanban. O repositório também inclui agora o início da API em **Java e Spring Boot**, com PostgreSQL para persistência de projetos.

O frontend e o backend ainda são **independentes**: a versão online continua demonstrativa, e a integração com a API será feita nas próximas etapas.

## O que já está funcionando

### Frontend

- Workspaces e projetos com navegação e criação de itens.
- Quadro Kanban com criação e movimentação de tarefas.
- Edição de tarefas, prioridades, responsáveis, tags, prazos e comentários.
- Pesquisa, filtros, notificações, responsividade e temas claro/escuro.
- Estado com Zustand, dados iniciais via DummyJSON e alterações gravadas no `localStorage`.
- Sincronização de estado entre abas **do mesmo navegador** com `BroadcastChannel`.
- Formulários com React Hook Form e Zod e testes com Jest e React Testing Library.

A tela de entrada utiliza uma **sessão demonstrativa no navegador**, não autenticação de usuários no servidor. Os dados da aplicação online não são compartilhados entre pessoas ou dispositivos; recursos de colaboração entre usuários ainda não estão disponíveis.

### Backend — primeira etapa

O diretório [`backend/`](backend/) contém uma API REST inicial com Java 21, Spring Boot, JPA/Hibernate, PostgreSQL e Flyway. Os endpoints implementados permitem:

- Criar projetos: `POST /api/projects`.
- Listar projetos: `GET /api/projects`.
- Consultar um projeto: `GET /api/projects/{id}`.
- Consultar a saúde da aplicação: `GET /actuator/health`.

A API tem validação dos dados recebidos e respostas HTTP para erros comuns. Há testes unitários iniciais para a camada de serviço. **Ela ainda não está hospedada nem conectada ao frontend.**

## Tecnologias

| Frontend | Backend |
| --- | --- |
| Next.js 14, React 18, TypeScript | Java 21, Spring Boot 3.5 |
| Tailwind CSS, Zustand, TanStack Query | Spring Web, Spring Data JPA / Hibernate |
| React Hook Form, Zod | PostgreSQL, Flyway, Bean Validation |
| Jest, React Testing Library | JUnit 5, Mockito, Maven |

## Organização

```text
orquestria/
├── frontend/          # Next.js, publicado no Netlify
├── backend/           # API Spring Boot, banco local via Compose
│   ├── src/main/java/
│   ├── src/main/resources/db/migration/
│   ├── src/test/java/
│   ├── compose.yaml
│   └── pom.xml
├── docs/
│   └── DEPLOY_NETLIFY.md
├── netlify.toml
└── README.md
```

A implantação atual funciona assim:

```text
Site online (Netlify)
    └── Next.js / React
        ├── DummyJSON (dados iniciais)
        └── Zustand / localStorage (persistência local)

API local (independente)
    └── Java / Spring Boot
        └── Spring Data JPA / Hibernate
            └── PostgreSQL
```

O objetivo é que o frontend passe a consumir essa API por HTTPS, substituindo gradualmente os dados simulados pelas informações armazenadas no banco.

## Executar localmente

**Frontend** — Node.js 20+ e npm:

```bash
git clone https://github.com/fidelmrodriguez/orquestria.git
cd orquestria/frontend
npm ci
npm run dev
```

Abra `http://localhost:3000`. Os campos de login já vêm preenchidos para testar a demonstração. A carga inicial depende da disponibilidade da API pública DummyJSON.

**Backend** — Java 21, Maven 3.9+ e Docker:

```bash
# Em outro terminal, a partir da raiz do repositório:
cd backend
docker compose up -d
mvn spring-boot:run
```

A API inicia em `http://localhost:8080`. Veja os comandos, endpoints e exemplos de requisição em [backend/README.md](backend/README.md). A execução do backend exige PostgreSQL acessível; o Compose facilita o ambiente local.

## Publicação

A versão pública do frontend está em **https://orquestria.netlify.app/**. O Next.js é exportado como site estático (`frontend/out`), conforme o `netlify.toml`. O Netlify não executa a API Java deste projeto.

## Próximas etapas

- Ampliar o domínio da API para workspaces, colunas, tarefas e comentários.
- Criar autenticação e autorização no backend com Spring Security.
- Incluir testes de integração, documentação OpenAPI e infraestrutura para a API.
- Conectar o frontend à API e substituir a persistência demonstrativa por dados no PostgreSQL.

---

Desenvolvido por [Fidel M Rodriguez](https://github.com/fidelmrodriguez) · [LinkedIn](https://www.linkedin.com/in/fidelmrodriguez/)
