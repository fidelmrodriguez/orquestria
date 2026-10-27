# Orquestria API

API REST do Orquestria, construída com **Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, Flyway e PostgreSQL**. É responsável pelos contratos HTTP, regras de negócio, autenticação, autorização e persistência dos workspaces, projetos, tarefas, equipes e tags. A camada de apresentação está documentada no [frontend](../frontend/README.md).

## Organização da API

O código Java em `src/main/java/com/orquestria/api/` separa autenticação, endpoints e domínio de workspaces/projetos/tarefas. Os controladores expõem contratos REST; serviços aplicam validações e regras de acesso; a persistência usa JPA/Hibernate e consultas SQL transacionais quando necessário. O esquema é versionado em `src/main/resources/db/migration/`.

A API atende o frontend Next.js, mas mantém as regras de autorização e integridade no servidor, independentemente do estado da interface. Consulte [Arquitetura](../docs/ARQUITETURA.md) e [Decisões técnicas](../docs/DECISOES_TECNICAS.md).

## Executar

Pré-requisitos: Java 21, Maven e PostgreSQL. O diretório inclui uma configuração Docker Compose para o banco local.

```bash
cd backend
docker compose up -d
mvn spring-boot:run
```

Variáveis de ambiente:

| Variável | Finalidade |
| --- | --- |
| `DB_URL` | URL JDBC do PostgreSQL |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `APP_CORS_ALLOWED_ORIGIN` | Origem autorizada para o frontend (padrão da aplicação publicada) |
| `APP_GUEST_PASSWORD` | Senha utilizada na criação inicial da conta de demonstração |

Não armazene senhas reais ou tokens no repositório. O Flyway aplica as migrações pendentes quando a API inicia.

## Principais recursos

| Recurso | Rotas principais |
| --- | --- |
| Autenticação | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Workspaces | `GET/POST /api/workspaces`, `GET /api/workspaces/{id}` |
| Projetos | `GET/POST /api/projects`, `GET /api/projects/{id}`, `POST /api/projects/{id}/rename` |
| Colunas | `GET/POST /api/projects/{id}/columns`, `POST /api/projects/{id}/columns/{columnId}/rename` |
| Tarefas | `GET/POST /api/projects/{id}/tasks`, `POST .../{taskId}/edit`, `POST .../{taskId}/comments`, `POST/PATCH .../{taskId}/move` |
| Exclusões | `POST` em rotas `/delete` para tarefas, colunas, projetos e workspaces; também há rotas `DELETE` correspondentes |
| Comentários | `POST /api/projects/{projectId}/tasks/{taskId}/comments`, `POST /api/projects/{projectId}/tasks/{taskId}/comments/{commentId}/delete` e alternativa `DELETE` |
| Diretório e equipe | `GET /api/users/search`, `GET/POST /api/team/members`, `POST /api/team/members/{memberId}/remove` |
| Tags | `GET/POST /api/tags`, `POST /api/tags/{id}/rename`, `POST /api/tags/{id}/remove` |
| Saúde | `GET /actuator/health` |

Os endpoints privados exigem `Authorization: Bearer <token>`. O servidor confere o proprietário ou o acesso explícito do membro-admin ao projeto. Algumas operações de atualização ou exclusão usam `POST` para compatibilidade com o ambiente de hospedagem. Consulte [a referência da API](../docs/API.md) para detalhes.

## Regras relevantes

- Uma coluna só pode ser removida se não possuir tarefas; um workspace só pode ser removido se não possuir projetos.
- A exclusão de um projeto remove suas colunas e tarefas vinculadas, incluindo comentários associados.
- Responsáveis por tarefas devem ser o proprietário ou usuários cadastrados como membros da equipe.
- Um membro atribuído a tarefas não pode ser removido antes da reatribuição.
- Tags são catalogadas por proprietário, com prevenção de nomes duplicados sem diferenciar maiúsculas/minúsculas.
- Membros têm acesso somente aos projetos em que foram explicitamente adicionados; os demais projetos permanecem privados.

## Banco e migrações

As migrações Flyway disponíveis são `V1` a `V10`: projetos; domínio Kanban; detalhes e comentários; contas e propriedade; nomes de usuário únicos; membros de equipe; catálogo de tags; importação de tags existentes; retenção e atividade das contas; colaboração por projeto (V10). **Não modifique versões de migrações já executadas**; crie uma nova versão para alterações posteriores.

## Testes

```bash
cd backend
mvn test
mvn verify
```

O workflow do GitHub Actions disponibiliza um PostgreSQL 16 temporário para os testes de integração. Os testes que dependem do banco são habilitados com `ORQUESTRIA_RUN_DB_TESTS=true` e as variáveis `DB_*` apontando para um banco descartável. Nenhum teste de CI utiliza o banco de produção.

Consulte [Testes e CI](../docs/TESTES.md), [Deploy](../docs/DEPLOY_CLOUD.md) e [Exemplos de consumo da API](../docs/API_EXEMPLOS.md).

## Controle de acesso por projeto

O backend diferencia **admin** (`projects.owner_id`) e **membro-admin** (`project_members`). O membro-admin pode operar somente os projetos vinculados; não recebe acesso a outros projetos do workspace e não pode alterar participantes. Veja [colaboração por projeto](../docs/COLABORACAO.md).
