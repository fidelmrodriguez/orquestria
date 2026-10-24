# Orquestria

Uma aplicação para organizar projetos, tarefas e o trabalho em equipe. O quadro Kanban foi construído em **Next.js, React e TypeScript**; a API usa **Java 21, Spring Boot e PostgreSQL**.

**[Abrir aplicação](https://orquestria.netlify.app/)** · [API (saúde)](https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health) · [Frontend](frontend/) · [Backend](backend/)
## Aplicação

No Orquestria, você pode navegar por workspaces e projetos, criar colunas, organizar tarefas no Kanban e acompanhar os detalhes de cada atividade. O frontend inclui edição de título, descrição, prioridade, responsáveis e prazo, comentários, pesquisa, filtros, versão mobile e temas claro/escuro. Tarefas sem data de vencimento são permitidas e aparecem com a indicação **Sem prazo** no Kanban.
### Integração com Java
O quadro principal consulta a API Spring Boot sempre que `NEXT_PUBLIC_ORQUESTRIA_API_URL` estiver configurada. Nessa modalidade, projetos, colunas, tarefas e comentários são carregados do PostgreSQL. Criação, edições e movimentações são enviadas ao backend por HTTP; após cada gravação, a interface consulta os dados novamente. Enquanto uma operação está em andamento, um modal de carregamento bloqueia novas interações e indica a ação em curso.
O modal fecha tanto no sucesso quanto na falha, e os erros continuam disponíveis no aviso do quadro.
Se a variável da API não estiver configurada, o frontend continua disponível em **modo demonstrativo local**, com dados da DummyJSON, Zustand e `localStorage`. Esse modo serve apenas para a interface e não deve ser confundido com persistência no PostgreSQL.
O acesso é protegido pelo **Spring Security**: visitantes encontram a conta pública **guest** com as credenciais preenchidas, mas podem editar ambos os campos para informar outras credenciais ou acessar os formulários de login pessoal e cadastro. Múltiplas sessões guest compartilham o mesmo Kanban; contas cadastradas têm workspaces e projetos separados por usuário. Contas pessoais podem entrar por nome de usuário único ou e-mail. As senhas são armazenadas com BCrypt e as sessões usam tokens aleatórios revogáveis.
O guest é um ambiente público. Use somente informações fictícias nele. A página de diagnóstico agora exige login para consultar ou alterar registros.
### Funcionalidades da API
- Workspaces e projetos, incluindo associação de projetos a workspaces e alteração do nome do projeto.
- Colunas do Kanban, com criação, listagem e alteração do título.
- Tarefas, com criação, consulta, edição de detalhes, prioridade, responsável, tags, prazo e movimentação entre colunas do mesmo projeto.
- Comentários em tarefas, validações de entrada e respostas HTTP de erro.
- Migrações Flyway `V1` a `V5`, com histórico preservado e proprietários por usuário.
- Cadastro, login, logout e sessões simultâneas com Spring Security.
> Nesta fase ainda não há compartilhamento privado entre contas, exclusão de usuários, recuperação de senha, notificações em tempo real ou manutenção automática do banco.
## Tecnologias

| Frontend | Backend e infraestrutura |
| --- | --- |
| Next.js 14, React 18 e TypeScript | Java 21 e Spring Boot 3.5 |
| Zustand e TanStack Query | Spring Security, Spring Web e Spring Data JPA/Hibernate |
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
│       ├── V3__task_details_comments.sql
│       ├── V4__accounts_and_ownership.sql
│       └── V5__unique_usernames.sql
├── docs/
│   ├── README.md
│   ├── ETAPA_0_FRONTEND.md
│   ├── ETAPA_1_API_JAVA.md
│   ├── ETAPA_2_DEPLOY_NUVEM.md
│   ├── ETAPA_3_KANBAN_API.md
│   ├── ETAPA_4_INTEGRACAO.md
│   ├── ETAPA_5_AUTENTICACAO.md
│   ├── DEPLOY_NETLIFY.md
│   └── DEPLOY_CLOUD.md
├── netlify.toml
└── README.md
```
## Arquitetura e infraestrutura

O Orquestria separa a interface, a API REST e a persistência em serviços independentes:

```text
Navegador → Netlify (Next.js/React) → Blitz (Java/Spring Boot) → Neon (PostgreSQL)
```
O frontend é publicado no Netlify e se comunica com a API Spring Boot por HTTPS, utilizando JSON. O backend é executado no Blitz, enquanto o Neon hospeda o banco PostgreSQL. O acesso aos dados é realizado com Spring Data JPA/Hibernate, e as alterações de esquema são versionadas pelo Flyway.
A URL pública da API é informada ao frontend pela variável de build `NEXT_PUBLIC_ORQUESTRIA_API_URL`. As credenciais de banco de dados permanecem restritas ao ambiente do backend, por meio das variáveis `DB_URL`, `DB_USER` e `DB_PASSWORD`.
Os serviços possuem ciclos de publicação independentes. Na infraestrutura gratuita, a API pode apresentar maior latência na primeira requisição após um período de inatividade.
O [índice da documentação](docs/README.md) reúne as etapas de desenvolvimento. Os detalhes da [autenticação](docs/ETAPA_5_AUTENTICACAO.md), da [integração do Kanban](docs/ETAPA_4_INTEGRACAO.md) e da [infraestrutura](docs/DEPLOY_CLOUD.md) estão documentados separadamente. Há também uma [página de diagnóstico](https://orquestria.netlify.app/diagnostico/) para verificar a comunicação com a API.
## Executar localmente (opcional)

Frontend: `cd frontend && npm ci && npm run dev`. Backend: `cd backend && docker compose up -d && mvn spring-boot:run` (exige Java 21, Maven e Docker). Mais detalhes em [backend/README.md](backend/README.md).
## Próximas evoluções

- Recuperação de senha, compartilhamentos privados e permissões avançadas.
- Testes de integração com PostgreSQL, documentação OpenAPI e tratamento de concorrência.
- Operações de exclusão com regras explícitas e auditoria.
- **Manutenção automática e política de retenção de dados:** planejadas para uma etapa futura; ainda não implementadas.

---

Desenvolvido por [Fidel M Rodriguez](https://github.com/fidelmrodriguez).
