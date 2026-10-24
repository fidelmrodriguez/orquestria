# Etapa 6 — CRUD completo e regras de negócio

## Parte 1 — Exclusões protegidas no backend

O Orquestria já permite criar, listar, editar e movimentar registros do Kanban. Esta entrega adiciona as **rotas HTTP DELETE** sem apagar dados durante o deploy e sem implementar manutenção automática.

| Método | Endpoint | Regra |
| --- | --- | --- |
| `DELETE` | `/api/projects/{projectId}/tasks/{taskId}` | Exclui a tarefa, seus comentários associados e ajusta a ordem da coluna |
| `DELETE` | `/api/projects/{projectId}/columns/{columnId}` | Exclui somente colunas vazias; retorna `409` quando ainda houver tarefas |
| `DELETE` | `/api/projects/{projectId}` | Exclui tarefas, colunas e o projeto na mesma transação |
| `DELETE` | `/api/workspaces/{workspaceId}` | Exclui somente workspaces sem projetos; retorna `409` caso contrário |

### Segurança

As rotas exigem a mesma autenticação via `Bearer` aplicada às rotas do Kanban. `CorsConfig` passa a autorizar o método `DELETE` e o cabeçalho `Authorization` nas chamadas do Netlify. Antes da operação, a API confirma que o projeto ou workspace pertence à conta autenticada. IDs inexistentes **ou pertencentes a outra conta** retornam `404` para não revelar informações sobre outros usuários. Em caso de falta de sessão, espera-se `401` da configuração Spring Security existente.

Não existe exclusão de conta, sessão guest ou compartilhamento entre usuários nesta entrega. A conta guest pode executar as operações explícitas sobre o seu quadro compartilhado; por isso a exclusão no frontend deverá incluir confirmação clara antes da execução.

### Integridade e transações

As operações usam `@Transactional`. Em projetos, a ordem de remoção é importante porque `tasks.column_id` referencia `board_columns.id` sem `ON DELETE CASCADE`. Por isso as tarefas são removidas antes das colunas. Comentários vinculados às tarefas são removidos pelo `ON DELETE CASCADE` da migração V3.

Uma coluna só pode ser excluída quando estiver vazia. O usuário precisa primeiro mover ou remover as tarefas; **não há migração automática silenciosa de tarefas**. A exclusão de workspace exige remover ou transferir seus projetos primeiro. Exclusões bem-sucedidas retornam `204 No Content`; `404` indica recurso inexistente/inacessível e `409` indica dependências impeditivas.

A ordem (`position`) das tarefas e colunas restantes é compactada após uma exclusão individual. As regras existentes de criação e movimentação permanecem inalteradas.

### Validação após o deploy

1. Publicar os arquivos em `backend/` e confirmar o build da API no Blitz.
2. Usando uma sessão pessoal e recursos próprios, chamar `DELETE /api/projects/{id}/tasks/{id}` e confirmar `204`; consultar novamente a tarefa e confirmar que não aparece na listagem.
3. Tentar excluir uma coluna que ainda contém tarefas; esperar `409` e dados preservados.
4. Esvaziar a coluna, excluí-la e confirmar `204`.
5. Tentar excluir workspace com projeto; esperar `409`.
6. Excluir o projeto explicitamente e depois o workspace vazio; esperar `204` para ambos.
7. Repetir uma das operações sem token (`401`) e com token de outra conta (`404`); confirmar que nada foi apagado.
8. Validar no Blitz que não houve exceção de chave estrangeira e que o banco permaneceu íntegro.

**Atenção:** os endpoints desta parte são operações destrutivas. Os botões e diálogos de confirmação no frontend **ainda não foram incluídos**. Não teste com dados reais ou importantes, especialmente na conta guest compartilhada.

### Próximas entregas da Etapa 6

- Integrar as quatro exclusões na interface React com confirmação, estados de carregamento e tratamento de `409`.
- Revisar casos de concorrência, validações adicionais e fluxos de navegação depois de uma exclusão.
- Introduzir paginação/ordenação apenas nas consultas em que a quantidade de registros justificar.

## Fora do escopo

Nenhuma nova migração, alteração de credenciais, exclusão automática, tarefa agendada ou limpeza do Neon foi acrescentada. A manutenção automática permanece reservada à **Etapa 8**.

Os testes de unidade cobrem acesso negado para projeto de outra conta, dependências impeditivas, remoção ordenada do projeto e ajuste de posições. Testes de integração completos com PostgreSQL e pipeline CI continuam previstos para a Etapa 7.

### Correção de build da Parte 1 (24/10/2026)

O commit inicial da Parte 1 não passou no teste automatizado de exclusões durante o build do Blitz. O diagnóstico do Blitz apontou divergência entre os argumentos esperados por uma simulação de acesso ao banco e as chamadas efetivas. Os testes usam `JdbcTemplate.update` para **mais de um SQL em sequência** na mesma operação; sob *strict stubbing* do Mockito, uma simulação específica pode causar conflito com outra chamada válida ao mesmo método.

Os três stubs de `JdbcTemplate.update` que compartilham esse padrão foram ajustados pontualmente com `lenient()`. **As verificações `verify(...)` e `InOrder` continuam ativas** para validar o SQL, os argumentos e a ordem efetiva das operações. Nenhum endpoint, serviço ou esquema de banco foi alterado por esta correção.

Após o commit, confirmar que o Blitz compila **e executa toda a suíte de testes Maven**, publica a nova versão e mantém a aplicação online. Somente então começar os testes manuais das rotas `DELETE` com dados descartáveis de uma conta pessoal.
