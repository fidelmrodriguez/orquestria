# Orquestria

Gestão de projetos e tarefas com workspaces, quadros Kanban e organização do trabalho em equipe.

**[Acessar o Orquestria](https://orquestria.netlify.app/)** · [Código do frontend](frontend/) · [Código do backend](backend/) · [Guia de publicação](docs/DEPLOY_NETLIFY.md)

O Orquestria começou como uma aplicação frontend em **Next.js, React e TypeScript**. Essa versão está publicada no Netlify e já permite navegar por projetos, organizar tarefas e utilizar o quadro Kanban. O repositório também inclui uma API em **Java e Spring Boot**, com PostgreSQL para persistência de projetos.

O Kanban principal ainda usa dados demonstrativos; a página `/diagnostico/` consulta a API real. O repositório inclui agora configuração de deploy e uma página isolada para testar a API via navegador; o Kanban será integrado nas próximas etapas.

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

### Backend — projetos, workspaces e Kanban (Etapa 3)

O diretório [`backend/`](backend/) contém uma API REST com Java 21, Spring Boot, JPA/Hibernate, PostgreSQL e Flyway. Os endpoints implementados permitem:

- Criar projetos: `POST /api/projects`.
- Listar projetos: `GET /api/projects`.
- Consultar um projeto: `GET /api/projects/{id}`.
- Consultar a saúde da aplicação: `GET /actuator/health`.
- Criar e listar workspaces.
- Associar opcionalmente projetos a workspaces.
- Criar e listar colunas e tarefas por projeto.
- Mover tarefas entre colunas do mesmo projeto.

A nova migração Flyway `V2` preserva os projetos gravados anteriormente no PostgreSQL.
Veja [os novos endpoints e exemplos da Etapa 3](docs/ETAPA_3_KANBAN_API.md).

A API tem validação dos dados recebidos e respostas HTTP para erros comuns. Há testes unitários iniciais para a camada de serviço. **A API atual está publicada no Blitz, usando o Neon. Os novos endpoints desta etapa entrarão em produção após o próximo deploy. A tela principal ainda utiliza dados demonstrativos.**

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
├── backend/           # API Spring Boot: Docker/Blitz + PostgreSQL Neon
│   ├── src/main/java/
│   ├── src/main/resources/db/migration/
│   ├── src/test/java/
│   ├── compose.yaml
│   └── pom.xml
├── docs/
│   ├── DEPLOY_NETLIFY.md
│   └── DEPLOY_CLOUD.md
├── render.yaml         # Configuração legada, não usada no Blitz
├── netlify.toml
└── README.md
```

A implantação atual funciona assim:

```text
Site online (Netlify)
    └── Next.js / React
        ├── DummyJSON (dados iniciais)
        └── Zustand / localStorage (persistência local)

API Java (deploy independente)
    └── Java / Spring Boot (Blitz)
        └── Spring Data JPA / Hibernate
            └── PostgreSQL (Neon)
```

A próxima integração é conectar o quadro principal do frontend a essa API por HTTPS, substituindo gradualmente os dados simulados pelas informações armazenadas no banco.

## Hospedagem e teste pelo navegador

A API está publicada no Blitz, o frontend no Netlify e o banco no Neon. O repositório contém `backend/Dockerfile`, usado no build do Blitz.

Com a URL do Blitz em `NEXT_PUBLIC_ORQUESTRIA_API_URL` no Netlify, abra [Diagnóstico da API](https://orquestria.netlify.app/diagnostico/) para testar a API e a persistência de workspaces, projetos, colunas e tarefas após o deploy desta etapa. Essa página está separada do Kanban e não substitui a integração funcional do frontend.

**O backend está hospedado no Blitz e já respondeu aos testes de API com PostgreSQL.**

## Executar localmente (opcional)

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

A versão pública do frontend está em **https://orquestria.netlify.app/**. O Next.js é exportado como site estático (`frontend/out`). O Netlify não executa Java. O A API Java é implantada no Blitz a partir do Dockerfile do backend e usa o banco PostgreSQL criado no Neon. A página `/diagnostico/` facilita os testes via navegador, incluindo colunas e tarefas nesta etapa.

## Próximas etapas

- Ampliar o domínio para comentários, responsáveis e edição de tarefas.
- Criar autenticação e autorização no backend com Spring Security.
- Incluir testes de integração, documentação OpenAPI e infraestrutura para a API.
- Conectar o frontend à API e substituir a persistência demonstrativa por dados no PostgreSQL.

---

Desenvolvido por [Fidel M Rodriguez](https://github.com/fidelmrodriguez) · [LinkedIn](https://www.linkedin.com/in/fidelmrodriguez/)
