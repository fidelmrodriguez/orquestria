# API REST

**Base pública:** `https://orquestria-api.fidelmrodriguez.blitz.cloud`

A API usa JSON e HTTPS. As rotas privadas exigem:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Tokens são emitidos no login/cadastro e devem ser mantidos privados. O endpoint de saúde e as operações de login/cadastro são públicos.

## Autenticação

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Criar conta pessoal |
| `POST` | `/api/auth/login` | Entrar por nome de usuário ou e-mail; a conta guest também utiliza login |
| `GET` | `/api/auth/me` | Consultar a sessão atual |
| `POST` | `/api/auth/logout` | Revogar a sessão atual |
| `GET` | `/actuator/health` | Verificar a disponibilidade da aplicação |

As senhas são protegidas com BCrypt. As sessões Bearer utilizam tokens aleatórios, armazenados pela API somente na forma de hash. Dados criados na conta guest são compartilhados entre visitantes que utilizam essa conta.

## Workspaces e projetos

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` / `POST` | `/api/workspaces` | Listar e criar workspaces |
| `GET` | `/api/workspaces/{workspaceId}` | Consultar workspace |
| `GET` / `POST` | `/api/projects` | Listar e criar projetos |
| `GET` | `/api/projects/{projectId}` | Consultar projeto |
| `POST` | `/api/projects/{projectId}/rename` | Renomear projeto |
| `POST` | `/api/projects/{projectId}/delete` | Excluir projeto e seus dados associados |
| `POST` | `/api/workspaces/{workspaceId}/delete` | Excluir workspace vazio |

Projetos podem estar associados a workspaces. A exclusão de um workspace com projetos é rejeitada até que suas dependências sejam resolvidas.

## Colunas, tarefas e comentários

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` / `POST` | `/api/projects/{projectId}/columns` | Listar e criar colunas |
| `POST` | `/api/projects/{projectId}/columns/{columnId}/rename` | Alterar título da coluna |
| `POST` | `/api/projects/{projectId}/columns/{columnId}/delete` | Excluir coluna sem tarefas |
| `GET` / `POST` | `/api/projects/{projectId}/tasks` | Listar e criar tarefas |
| `POST` | `/api/projects/{projectId}/tasks/{taskId}/edit` | Atualizar detalhes da tarefa |
| `POST` | `/api/projects/{projectId}/tasks/{taskId}/comments` | Registrar comentário |
| `POST` | `/api/projects/{projectId}/tasks/{taskId}/comments/{commentId}/delete` | Excluir um comentário da tarefa |
| `DELETE` | `/api/projects/{projectId}/tasks/{taskId}/comments/{commentId}` | Alternativa REST para excluir um comentário |
| `POST` ou `PATCH` | `/api/projects/{projectId}/tasks/{taskId}/move` | Mover uma tarefa |
| `POST` | `/api/projects/{projectId}/tasks/{taskId}/delete` | Excluir tarefa |

As exclusões também possuem métodos `DELETE` correspondentes. As rotas de ação `POST /delete` e `POST /rename` estão presentes por compatibilidade com as restrições de CORS do ambiente de publicação.

A exclusão de comentários exige autenticação, valida a propriedade do projeto e confirma que o comentário pertence à tarefa. Retorna `404` para IDs inválidos ou de outros recursos. As operações de escrita de tarefas e comentários retornam a tarefa atualizada em JSON, permitindo atualizar apenas o item alterado no frontend.

A API valida o vínculo dos recursos ao projeto e o acesso do proprietário ou de um membro-admin autorizado. Colunas ocupadas retornam conflito em vez de excluir tarefas implicitamente. A exclusão explícita de projeto remove seus dados associados em transação.

## Equipe

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/users/search?q=texto` | Pesquisar usuários cadastrados para inclusão na equipe |
| `GET` | `/api/team/members` | Consultar membros da equipe da conta |
| `POST` | `/api/team/members` | Adicionar membro (`{"userId":"UUID"}`) |
| `POST` | `/api/team/members/{memberId}/remove` | Remover membro sem tarefas atribuídas |

A lista legada `/api/team/members` permite organizar responsáveis e não libera projetos automaticamente. Para permitir acesso, o admin deve adicionar explicitamente o usuário ao projeto por `/api/projects/{projectId}/members` (detalhes abaixo). A remoção de um membro exige reatribuir suas tarefas primeiro.

## Tags

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/tags?q=texto` | Consultar o catálogo e sugestões de autocomplete |
| `POST` | `/api/tags` | Cadastrar tag (`{"name":"Revisão"}`) |
| `POST` | `/api/tags/{id}/rename` | Renomear tag (`{"name":"Nova tag"}`) |
| `POST` | `/api/tags/{id}/remove` | Remover tag do catálogo |

O catálogo é separado por conta. Tags com nomes equivalentes ignorando maiúsculas/minúsculas não são duplicadas. Renomear ou remover uma tag do catálogo não altera automaticamente as tags já armazenadas em tarefas.

## Respostas e autorização

| Status | Significado típico |
| --- | --- |
| `200` / `201` | Consulta ou criação concluída |
| `204` | Exclusão ou alteração concluída sem corpo de resposta |
| `400` | Dados inválidos ou incompletos |
| `401` | Token ausente, inválido ou expirado |
| `404` | Recurso inexistente ou não acessível à conta atual |
| `409` | Conflito de integridade, como coluna ocupada ou membro com tarefas atribuídas |

A verificação de propriedade acontece no servidor, não depende de filtros visuais do frontend. Para detalhes de execução e persistência, consulte [Arquitetura](ARQUITETURA.md) e [Backend](../backend/README.md).

Para chamadas Bash com `curl` e exemplos de payloads coerentes com os DTOs do backend, consulte [Exemplos de uso da API](API_EXEMPLOS.md).

### Ordenação das tarefas

`POST /api/projects/{projectId}/tasks/{taskId}/move` recebe `{"columnId":"uuid-da-coluna","position":0}`. `position` é o índice da tarefa **após sua remoção da posição anterior**, começando em zero. Também permite reordenação dentro da mesma coluna. A API recalcula as posições sequenciais das tarefas afetadas na origem e no destino em uma transação e retorna a tarefa movimentada. O cliente não envia a operação quando a posição não muda.

## Colaboração por projeto

As seguintes operações exigem autenticação Bearer:

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/projects/invited` | Lista somente os projetos explicitamente compartilhados com a conta autenticada; inclui nome do workspace para a sidebar |
| GET | `/api/projects/{projectId}/members` | Lista o admin e os membro-admin daquele projeto para usuários com acesso |
| POST | `/api/projects/{projectId}/members` | Adiciona usuário cadastrado (`{ "userId": "UUID" }`); somente o admin |
| POST | `/api/projects/{projectId}/members/{memberId}/remove` | Revoga vínculo do membro, após reatribuição das tarefas; somente o admin |

O membro-admin pode usar os endpoints de tarefas, colunas, comentários, renomeação e exclusão do projeto compartilhado. Ele não recebe acesso às rotas do workspace inteiro nem a outros projetos do mesmo proprietário. Veja [Colaboração](COLABORACAO.md).
