# Etapa 3 — Modelagem de workspaces e tarefas

O backend do Orquestria já está hospedado no Blitz e conectado ao PostgreSQL do Neon.
Nesta etapa, a API evolui para suportar workspaces, projetos associados a workspaces,
colunas de Kanban e tarefas. O frontend principal permanece demonstrativo nesta entrega.

## Rotas

| Método | Endpoint | Função |
| --- | --- | --- |
| GET | `/api/workspaces` | Listar workspaces |
| POST | `/api/workspaces` | Criar workspace |
| GET | `/api/workspaces/{id}` | Consultar workspace |
| POST | `/api/projects` | Criar projeto, com `workspaceId` opcional |
| GET | `/api/projects/{projectId}/columns` | Listar colunas |
| POST | `/api/projects/{projectId}/columns` | Criar coluna |
| GET | `/api/projects/{projectId}/tasks` | Listar tarefas |
| POST | `/api/projects/{projectId}/tasks` | Criar tarefa |
| PATCH | `/api/projects/{projectId}/tasks/{taskId}/move` | Mover uma tarefa entre colunas |

## Exemplos de JSON

Criar workspace: `{"name":"Operação Digital","description":"Projeto de estudo"}`

Criar projeto com workspace: `{"name":"Portal","description":"Teste","workspaceId":"UUID_DO_WORKSPACE"}`

Criar coluna: `{"title":"Backlog","position":0,"color":"slate"}`

Criar tarefa: `{"title":"Preparar API","description":"Implementar regras","columnId":"UUID_DA_COLUNA","priority":"MEDIA","position":0}`

Mover tarefa: `{"columnId":"UUID_DA_OUTRA_COLUNA","position":1}`

Prioridades disponíveis: `BAIXA`, `MEDIA`, `ALTA` e `CRITICA`.

## Publicação e validação sem ambiente local

1. Envie os arquivos para a mesma estrutura do repositório GitHub.
2. O Blitz faz o deploy automático da branch `main`, compila e executa os testes Maven pelo Dockerfile.
3. Nos logs da aplicação, confira `Successfully applied 1 migration` para a V2.
4. Abra `https://orquestria.netlify.app/diagnostico/` e crie uma coluna e uma tarefa.
5. Atualize a página, escolha o mesmo projeto e consulte novamente para confirmar a persistência.

A migração `V2__workspaces_kanban_tasks.sql` é incremental: **não apaga** os projetos existentes,
incluindo o projeto criado durante o teste anterior. Nunca edite a migração V1 já executada.

**Segurança:** os endpoints de gravação ainda não possuem autenticação. Use apenas dados fictícios;
esta API e a tela de diagnóstico são experimentais. Não publique informações pessoais ou sigilosas.
