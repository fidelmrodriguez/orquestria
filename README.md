# Orquestria

**Orquestria** é uma aplicação web para organizar workspaces, projetos e tarefas em quadros Kanban. A interface é desenvolvida com Next.js e TypeScript, enquanto a API REST utiliza Java, Spring Boot e PostgreSQL.

[**Acessar aplicação**](https://orquestria.netlify.app/) · [Frontend — React/Next.js](frontend/README.md) · [Backend — Java/Spring Boot](backend/README.md) · [Arquitetura](docs/ARQUITETURA.md) · [API](docs/API.md)

[![Orquestria CI](https://img.shields.io/github/actions/workflow/status/fidelmrodriguez/orquestria/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI&labelColor=243047)](https://github.com/fidelmrodriguez/orquestria/actions/workflows/ci.yml)

## Funcionalidades

- **Organização:** workspaces, projetos e colunas personalizáveis em um quadro Kanban, com criação de colunas na barra superior e rolagem por coluna.
- **Tarefas:** criação direto da coluna, edição, movimentação, prioridades, prazos opcionais e comentários com exclusão individual.
- **Responsáveis e equipes:** associação de usuários cadastrados à equipe e atribuição de membros às tarefas.
- **Tags:** catálogo por conta, autocomplete, inclusão, edição e remoção de tags nas tarefas.
- **Gerenciamento:** exclusão contextual de tarefas, colunas, projetos e workspaces, além da página específica de gerenciamento. Operações destrutivas exigem confirmação e respeitam dependências.
- **Contas e sessões:** cadastro, login por nome de usuário ou e-mail, sessão persistida entre atualizações e isolamento dos dados de cada conta.
- **Interface:** busca, filtros, navegação responsiva e temas claro/escuro.

A aplicação oferece uma conta de demonstração compartilhada (*guest*), acessível pela tela de login. **Dados inseridos nessa conta podem ser vistos e alterados por outros visitantes.** Para conteúdo privado, utilize uma conta pessoal.

## Interface e implementação

A camada de frontend combina componentes React reutilizáveis, estado de interface em Zustand e integração tipada com a API. O quadro oferece drag-and-drop com prévia de inserção, reordenação persistente, criação contextual de tarefas e painéis laterais para edição. Para telas menores, a navegação muda para uma coluna por vez; em desktop, a sidebar pode ser recolhida para ampliar a área do Kanban.

As escolhas de interação, a organização dos componentes, os testes de interface e as instruções para executar o Next.js estão no [README do frontend](frontend/README.md).

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

O frontend utiliza a API para persistir os dados de trabalho. O Spring Security exige autenticação nas rotas privadas e verifica a titularidade dos recursos antes das operações. O esquema do banco é versionado com Flyway; as migrações disponíveis vão de **V1 a V9**.

Como a hospedagem da API pode suspender processos inativos, a interface verifica a disponibilidade do Spring Boot antes de apresentar as telas de login e do quadro. Durante a inicialização, apresenta o estado **Preparando seu ambiente**, com tempo decorrido; a espera não representa uma falha de autenticação. O endpoint de prontidão é encaminhado pelo proxy do Netlify.

Para conhecer as decisões e os fluxos completos, consulte a [arquitetura](docs/ARQUITETURA.md).

## Primeiros passos

1. Acesse a [aplicação publicada](https://orquestria.netlify.app/). Se a API estiver suspensa por inatividade, aguarde a tela de preparação concluir a verificação automática.
2. Para conhecer o Kanban sem cadastro, entre na conta de demonstração. Utilize **apenas dados descartáveis**, pois são compartilhados.
3. Para organizar dados privados, crie uma conta pessoal. Crie um workspace, associe um projeto a ele e organize tarefas nas colunas.
4. Abra uma tarefa para ajustar responsável, prioridade, prazo, tags e comentários; use os menus contextuais para exclusões com confirmação.

A inclusão de uma pessoa na equipe permite atribuir-lhe tarefas, mas **não compartilha** projetos privados com ela.

## Estrutura do repositório

```text
orquestria/
├── frontend/                   # Interface Next.js, componentes, estado e testes
│   └── README.md               # Arquitetura, UX e execução do frontend
├── backend/                    # API Spring Boot, serviços e testes
│   ├── README.md               # Contratos e execução do backend
│   └── src/main/resources/db/migration/
├── docs/                       # Arquitetura, API, operação e planejamento
├── .github/workflows/ci.yml   # Integração contínua
└── netlify.toml                # Build e publicação do frontend
```

## Desenvolvimento

Pré-requisitos para execução local: Node.js 22 (definido em `.nvmrc`), Java 21, Maven e PostgreSQL. O banco pode ser iniciado pelo Docker Compose disponível no diretório `backend/`.

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

As credenciais da conexão devem ser configuradas por variáveis de ambiente. Não utilize as credenciais de produção em ambientes locais ou de teste. Os guias do [frontend](frontend/README.md) e do [backend](backend/README.md) detalham a configuração das duas aplicações. Veja também os guias de [publicação](docs/README.md).

## Testes e documentação

O repositório possui testes automatizados do frontend e backend, testes de integração com PostgreSQL e um workflow de CI para executar verificações em commits e pull requests. Consulte [Testes e integração contínua](docs/TESTES.md) para os comandos e critérios de validação.

- [Frontend: interface, arquitetura React e execução](frontend/README.md)
- [Backend: API, persistência e execução](backend/README.md)
- [Índice da documentação](docs/README.md)
- [Arquitetura e decisões](docs/ARQUITETURA.md)
- [Referência da API](docs/API.md)
- [Deploy da API e do banco](docs/DEPLOY_CLOUD.md)
- [Deploy do frontend](docs/DEPLOY_NETLIFY.md)
- [Decisões técnicas](docs/DECISOES_TECNICAS.md)
- [Exemplos da API](docs/API_EXEMPLOS.md)
- [Publicação da versão 1.0.0](docs/RELEASE.md)
- [Histórico de versões](CHANGELOG.md)
- [Roadmap](docs/ROADMAP.md)

---

Desenvolvido por [Fidel M Rodriguez](https://github.com/fidelmrodriguez).
