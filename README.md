# Orquestria

**Orquestria** é uma aplicação web para organizar workspaces, projetos e tarefas em quadros Kanban. A interface é desenvolvida com Next.js e TypeScript, enquanto a API REST utiliza Java, Spring Boot e PostgreSQL.

[**Acessar aplicação**](https://orquestria.netlify.app/) · [Arquitetura](docs/ARQUITETURA.md) · [API](docs/API.md) · [Documentação](docs/README.md)

## Funcionalidades

- **Organização:** workspaces, projetos e colunas personalizáveis em um quadro Kanban.
- **Tarefas:** criação, edição, movimentação entre colunas, prioridades, prazos opcionais e comentários.
- **Responsáveis e equipes:** associação de usuários cadastrados à equipe e atribuição de membros às tarefas.
- **Tags:** catálogo por conta, autocomplete, inclusão, edição e remoção de tags nas tarefas.
- **Gerenciamento:** exclusão contextual de tarefas, colunas, projetos e workspaces, além da página específica de gerenciamento. Operações destrutivas exigem confirmação e respeitam dependências.
- **Contas e sessões:** cadastro, login por nome de usuário ou e-mail, sessão persistida entre atualizações e isolamento dos dados de cada conta.
- **Interface:** busca, filtros, navegação responsiva e temas claro/escuro.

A aplicação oferece uma conta de demonstração compartilhada (*guest*), acessível pela tela de login. **Dados inseridos nessa conta podem ser vistos e alterados por outros visitantes.** Para conteúdo privado, utilize uma conta pessoal.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Estado e formulários | Zustand, TanStack Query, React Hook Form, Zod |
| API | Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA |
| Persistência | PostgreSQL (Neon), Flyway |
| Testes e CI | JUnit 5, Mockito, Spring Boot Test, Jest, React Testing Library, GitHub Actions, JaCoCo |
| Publicação | Netlify (frontend estático) e Blitz (API Java) |

## Arquitetura

```text
Navegador
   │
   ▼
Netlify — Next.js estático
   │ HTTPS / JSON
   ▼
Blitz — API Spring Boot
   │ JDBC / TLS
   ▼
Neon — PostgreSQL
```

O frontend utiliza a API para persistir os dados de trabalho. O Spring Security exige autenticação nas rotas privadas e verifica a titularidade dos recursos antes das operações. O esquema do banco é versionado com Flyway; as migrações disponíveis vão de **V1 a V8**.

Como a hospedagem da API pode suspender processos inativos, a interface verifica a disponibilidade do Spring Boot antes de apresentar as telas de login e do quadro. Durante a inicialização, apresenta o estado **Preparando seu ambiente**, com tempo decorrido; a espera não representa uma falha de autenticação. O endpoint de prontidão é encaminhado pelo proxy do Netlify.

Para conhecer as decisões e os fluxos completos, consulte a [arquitetura](docs/ARQUITETURA.md).

## Estrutura do repositório

```text
orquestria/
├── frontend/                   # Next.js, componentes, estado e testes
├── backend/                    # Spring Boot, controllers, serviços e testes
│   └── src/main/resources/db/migration/
├── docs/                       # Arquitetura, API, operação e planejamento
├── .github/workflows/ci.yml   # Integração contínua
└── netlify.toml                # Build e publicação do frontend
```

## Desenvolvimento

Pré-requisitos para execução local: Node.js, Java 21, Maven e PostgreSQL. O banco pode ser iniciado pelo Docker Compose disponível no diretório `backend/`.

**Frontend**

```bash
cd frontend
npm ci
npm run dev
```

**Backend**

```bash
cd backend
docker compose up -d
mvn spring-boot:run
```

As credenciais da conexão devem ser configuradas por variáveis de ambiente. Não utilize as credenciais de produção em ambientes locais ou de teste. A documentação do [backend](backend/README.md) e os guias de [deploy](docs/DEPLOY_CLOUD.md) detalham a configuração.

## Testes e documentação

O repositório possui testes automatizados do frontend e backend, testes de integração com PostgreSQL e um workflow de CI para executar verificações em commits e pull requests. Consulte [Testes e integração contínua](docs/TESTES.md) para os comandos e critérios de validação.

- [Índice da documentação](docs/README.md)
- [Arquitetura e decisões](docs/ARQUITETURA.md)
- [Referência da API](docs/API.md)
- [Deploy da API e do banco](docs/DEPLOY_CLOUD.md)
- [Deploy do frontend](docs/DEPLOY_NETLIFY.md)
- [Roadmap](docs/ROADMAP.md)

---

Desenvolvido por [Fidel M Rodriguez](https://github.com/fidelmrodriguez).
