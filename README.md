# Orquestria

Uma aplicação para organizar projetos, tarefas e o trabalho em equipe. O quadro Kanban foi construído em **Next.js, React e TypeScript**; a API usa **Java 21, Spring Boot e PostgreSQL**.

**[Abrir aplicação](https://orquestria.netlify.app/)** · [API (saúde)](https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health) · [Frontend](frontend/) · [Backend](backend/)

## Aplicação

No Orquestria, você pode navegar por workspaces e projetos, criar colunas, organizar tarefas no Kanban e acompanhar os detalhes de cada atividade. O frontend inclui edição de título, descrição, prioridade, responsáveis e prazo, comentários, pesquisa, filtros, versão mobile e temas claro/escuro. Tarefas sem data de vencimento são permitidas e aparecem com a indicação **Sem prazo** no Kanban.

### Integração com Java

O quadro principal consulta a API Spring Boot sempre que `NEXT_PUBLIC_ORQUESTRIA_API_URL` estiver configurada. Nessa modalidade, projetos, colunas, tarefas e comentários são carregados do PostgreSQL. Criação, edições e movimentações são enviadas ao backend por HTTP; após cada gravação, a interface consulta os dados novamente.

Se a variável da API não estiver configurada, o frontend continua disponível em **modo demonstrativo local**, com dados da DummyJSON, Zustand e `localStorage`. Esse modo serve apenas para a interface e não deve ser confundido com persistência no PostgreSQL.

O login ainda é **demonstrativo**: não há autenticação ou isolamento por usuário no servidor. Os registros da API são compartilhados entre os visitantes e devem conter **somente dados fictícios**. O painel mostra um aviso sobre isso quando está conectado ao Java.

### Funcionalidades da API

- Workspaces e projetos, incluindo associação de projetos a workspaces e alteração do nome do projeto.
- Colunas do Kanban, com criação, listagem e alteração do título.
- Tarefas, com criação, consulta, edição de detalhes, prioridade, responsável, tags, prazo e movimentação entre colunas do mesmo projeto.
- Comentários em tarefas, validações de entrada e respostas HTTP de erro.
- Migrações Flyway `V1`, `V2` e `V3` e persistência com Spring Data JPA/Hibernate.

> Esta fase não inclui exclusão de registros, contas reais, permissões, notificações em tempo real entre usuários ou manutenção automática do banco.

## Tecnologias

| Frontend | Backend e infraestrutura |
| --- | --- |
| Next.js 14, React 18 e TypeScript | Java 21 e Spring Boot 3.5 |
| Zustand e TanStack Query | Spring Web e Spring Data JPA/Hibernate |
| Tailwind CSS, React Hook Form e Zod | PostgreSQL (Neon), Flyway e Bean Validation |
| Jest e React Testing Library | JUnit 5, Mockito e Maven |
| Netlify (exportação estática) | Docker e Blitz |

## Organização do repositório

```text
orquestria/
├── frontend/             # Aplicação Next.js
│   └── src/lib/remote-board.ts
├── backend/              # API REST Java
│   └── src/main/resources/db/migration/
│       ├── V1__create_projects.sql
│       ├── V2__workspaces_kanban_tasks.sql
│       └── V3__task_details_comments.sql
├── docs/
│   ├── ETAPA_3_KANBAN_API.md
│   ├── ETAPA_4_INTEGRACAO.md
│   ├── DEPLOY_NETLIFY.md
│   └── DEPLOY_CLOUD.md
├── netlify.toml
└── README.md
```

## Publicação e testes

A aplicação roda em serviços independentes:

```text
Navegador → Netlify (React/Next.js) → Blitz (Java/Spring Boot) → Neon (PostgreSQL)
```

No Netlify, a variável de build `NEXT_PUBLIC_ORQUESTRIA_API_URL` deve apontar para a URL HTTPS do serviço no Blitz, sem barra final. Credenciais do PostgreSQL ficam **somente** no Blitz (`DB_URL`, `DB_USER`, `DB_PASSWORD`). Não configure senhas no frontend.

Ao publicar uma mudança no GitHub, aguarde a **nova versão do backend** estar online no Blitz antes de testar o novo frontend no Netlify. Quando uma API está suspensa no plano gratuito, a primeira requisição pode demorar.

Veja [como testar a integração completa](docs/ETAPA_4_INTEGRACAO.md) e o [guia de infraestrutura](docs/DEPLOY_CLOUD.md). A página de [diagnóstico](https://orquestria.netlify.app/diagnostico/) continua disponível para verificar a comunicação com a API.

## Executar localmente (opcional)

Frontend: `cd frontend && npm ci && npm run dev`. Backend: `cd backend && docker compose up -d && mvn spring-boot:run` (exige Java 21, Maven e Docker). Mais detalhes em [backend/README.md](backend/README.md).

## Próximas evoluções

- Autenticação e autorização de verdade com Spring Security.
- Testes de integração com PostgreSQL, documentação OpenAPI e tratamento de concorrência.
- Operações de exclusão com regras explícitas e auditoria.
- **Manutenção automática e política de retenção de dados: etapa futura, em commit independente.** Nenhuma rotina de limpeza foi adicionada nesta entrega.

---

Desenvolvido por [Fidel M Rodriguez](https://github.com/fidelmrodriguez).
