# API Orquestria — Java e Spring Boot

API REST que atende o Kanban do frontend. Desenvolvida com Java 21, Spring Boot 3.5, Spring Data JPA, PostgreSQL, Flyway e Bean Validation.

## Endpoints

| Método | Rota | Ação |
| --- | --- | --- |
| GET | `/actuator/health` | Saúde da API (público) |
| POST | `/api/auth/login` | Login (guest ou conta cadastrada) |
| POST | `/api/auth/register` | Cadastro de conta individual |
| GET / POST | `/api/auth/me`, `/api/auth/logout` | Dados da sessão / logout |
| GET / POST | `/api/workspaces` | Listar / criar workspaces |
| GET | `/api/workspaces/{id}` | Consultar workspace |
| GET / POST | `/api/projects` | Listar / criar projetos |
| GET | `/api/projects/{id}` | Consultar projeto |
| POST | `/api/projects/{id}/rename` | Renomear projeto |
| GET / POST | `/api/projects/{id}/columns` | Listar / criar colunas |
| POST | `/api/projects/{id}/columns/{columnId}/rename` | Renomear coluna |
| GET / POST | `/api/projects/{id}/tasks` | Listar / criar tarefas |
| POST | `/api/projects/{id}/tasks/{taskId}/edit` | Editar detalhes da tarefa |
| POST | `/api/projects/{id}/tasks/{taskId}/comments` | Adicionar comentário |
| POST / PATCH | `/api/projects/{id}/tasks/{taskId}/move` | Mover tarefa |

Exceto login, cadastro e saúde, as rotas exigem `Authorization: Bearer <token>`. O servidor verifica a propriedade do workspace ou projeto antes de consultar ou alterar recursos. A conta guest é pública e compartilhada; as contas cadastradas têm dados separados.

As atualizações em `POST` usam rotas de ação para manter compatibilidade com o preflight CORS da hospedagem utilizada. As operações validam os dados com Bean Validation. A mudança de coluna verifica se a coluna pertence ao projeto da tarefa.

## Migrações

- `V1__create_projects.sql`: projetos.
- `V2__workspaces_kanban_tasks.sql`: workspaces, colunas e tarefas, preservando os projetos já salvos.
- `V3__task_details_comments.sql`: responsável, tags e comentários, preservando tarefas existentes.
- `V4__accounts_and_ownership.sql`: usuários, sessões e proprietário de workspaces/projetos. O bootstrap atribui os dados anteriores ao guest.

O Flyway aplica migrações pendentes na inicialização. Não edite versões de migrações já aplicadas no Neon; crie uma nova migração para mudanças futuras.

## Configuração

Em produção, configure no Blitz (não no GitHub):

```env
DB_URL=jdbc:postgresql://HOST/neondb?sslmode=require
DB_USER=USUARIO
DB_PASSWORD=SENHA
APP_CORS_ALLOWED_ORIGIN=https://orquestria.netlify.app
# Opcional antes da criação inicial do guest:
APP_GUEST_PASSWORD=OrquestriaDemo2026!
```

Rodar localmente é opcional:

```bash
cd backend
docker compose up -d
mvn test
mvn spring-boot:run
```

Docker e Java 21/Maven 3.9+ são necessários no ambiente local. O serviço do Blitz compila o Dockerfile diretamente do GitHub. Documentação em [DEPLOY_CLOUD.md](../docs/DEPLOY_CLOUD.md).

## Limitações atuais

O login usa Spring Security. A conta guest é pública e deve conter apenas dados fictícios. O projeto ainda não possui recuperação de senha, compartilhamentos privados entre contas, exclusão ou manutenção agendada. Consulte a [Etapa 5](../docs/ETAPA_5_AUTENTICACAO.md).
