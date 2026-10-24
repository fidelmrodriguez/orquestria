# API Orquestria — Java e Spring Boot

API REST que atende o Kanban do frontend. Desenvolvida com Java 21, Spring Boot 3.5, Spring Data JPA, PostgreSQL, Flyway e Bean Validation.

## Endpoints

| Método | Rota | Ação |
| --- | --- | --- |
| GET | `/actuator/health` | Saúde da API |
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

As atualizações em `POST` usam rotas de ação para manter compatibilidade com o preflight CORS da hospedagem utilizada. As operações validam os dados com Bean Validation. A mudança de coluna verifica se a coluna pertence ao projeto da tarefa.

## Migrações

- `V1__create_projects.sql`: projetos.
- `V2__workspaces_kanban_tasks.sql`: workspaces, colunas e tarefas, preservando os projetos já salvos.
- `V3__task_details_comments.sql`: responsável, tags e comentários, preservando tarefas existentes.

O Flyway aplica migrações pendentes na inicialização. Não edite versões de migrações já aplicadas no Neon; crie uma nova migração para mudanças futuras.

## Configuração

Em produção, configure no Blitz (não no GitHub):

```env
DB_URL=jdbc:postgresql://HOST/neondb?sslmode=require
DB_USER=USUARIO
DB_PASSWORD=SENHA
APP_CORS_ALLOWED_ORIGIN=https://orquestria.netlify.app
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

O login do frontend é fictício: **a API não autentica usuários nem isola dados por workspace**. Não use dados pessoais ou informações reais. Exclusão e manutenção agendada não estão implementadas. Consulte a [Etapa 4](../docs/ETAPA_4_INTEGRACAO.md) para os testes pela interface.
