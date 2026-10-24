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


## Parte 2 — Interface de gerenciamento seguro (`/gerenciar`)

Esta entrega adiciona uma página **independente** em `frontend/src/app/gerenciar/page.tsx`, sem substituir `AppShell` ou `board-store` do Kanban. Acesse `https://orquestria.netlify.app/gerenciar` depois de entrar na sua conta, sem sair da sessão do navegador. Se o Netlify publicar a página, não é necessário novo deploy Java.

A tela usa a variável existente `NEXT_PUBLIC_ORQUESTRIA_API_URL` e o token armazenado na sessão pelo `auth-client`. Carrega workspaces/projetos e, sob demanda, colunas/tarefas do projeto selecionado. Cada operação solicita confirmação; para projeto e workspace é necessário digitar `EXCLUIR`. Depois do `204`, a página recarrega os dados da API. Há mensagens separadas para sessão expirada (`401`), recurso inacessível (`404`), dependência impeditiva (`409`) e indisponibilidade da API.

A exclusão de coluna fica desabilitada quando a listagem indica tarefas nela. Mesmo com concorrência entre leitura e exclusão, **o backend continua fazendo a última validação** e pode retornar `409`. O mesmo vale para workspaces com projetos. A página não coleta nem exibe senhas ou tokens.

### Testes manuais após deploy

1. No Netlify, conferir a publicação do commit e visitar `/gerenciar` já autenticado numa conta de teste.
2. Criar um projeto descartável e uma coluna/tarefa pelo quadro principal e atualizar `/gerenciar`.
3. Excluir a tarefa de teste com confirmação e conferir se desapareceu depois da leitura da API.
4. Excluir a coluna agora vazia e confirmar a remoção.
5. Excluir projeto após digitar `EXCLUIR` e confirmar que não aparece mais.
6. Excluir workspace vazio, se existente, após digitar `EXCLUIR`.
7. Confirmar que o frontend desabilita exclusões proibidas por dependências e que erros `409` do backend são exibidos se houver mudança concorrente.
8. Voltar ao quadro principal e usar F5 para atualizar o estado local.

**Limitações deliberadas:** os botões não foram adicionados diretamente ao quadro principal nesta entrega, pois a integração dependeria de editar e testar a versão exata de `AppShell` e `board-store`. A página independente permite validar a API sem sobrescrever esses componentes. A interface principal integrada e a revisão final de concorrência e paginação continuam pendentes. Sem acesso ao checkout atual do repositório, a compilação e o deploy completo do Netlify ainda precisam ser confirmados.


## Correção transversal — Persistência de sessão (24/10/2026)

A integração inicial de `/gerenciar` evidenciou uma limitação anterior da Etapa 5: o token era
armazenado em `sessionStorage` (por aba), enquanto o estado visual do usuário era mantido no
Zustand somente em memória. Por isso, outra aba não enxergava a sessão, e o F5 exibia novamente
o formulário de login. A rota `/gerenciar` consultava somente o token da aba e informava
incorretamente ausência de sessão.

**Nesta correção**:

- O token é salvo em `localStorage`, compartilhado entre abas da mesma origem; tokens
  anteriores em `sessionStorage` são migrados na primeira leitura. Apenas o token é salvo,
  nunca a senha ou o perfil.
- Quando a tela de login aparece após um F5, o React consulta `GET /api/auth/me`
  com o bearer armazenado e restaura `useBoardStore.login(nome, email, id)`.
- `/gerenciar` verifica o mesmo `/me` antes de mostrar os controles e reage a logout
  realizado em outra aba removendo imediatamente as operações de exclusão.
- HTTP `401/403` da verificação limpa tokens inválidos; uma indisponibilidade temporária
  da API não apaga uma sessão válida. Logout remove o token compartilhado e revoga-o
  no backend como antes.

### Testes manuais necessários

1. Entrar com conta pessoal ou guest. Pressionar F5 na mesma aba: deve restaurar
   a conta automaticamente e permanecer no Kanban.
2. Abrir o Orquestria em **nova aba do mesmo navegador**: deve reconhecer a conta.
3. Acessar `/gerenciar` diretamente em uma nova aba: deve carregar os recursos
   após confirmar a sessão, sem exigir novo login.
4. Sair da conta, pressionar F5 e visitar `/gerenciar`: não deve manter acesso.
5. Simular token expirado ou revogado: a aplicação deve pedir novo login; não deve
   autenticar automaticamente como guest.
6. Bloquear temporariamente a API: exibir mensagem de verificação sem excluir
   o token salvo; testar novamente quando o serviço voltar.

**Nota de segurança:** `localStorage` é acessível a scripts da própria origem.
Isso resolve o uso entre abas dentro do modelo atual de bearer tokens, mas não
é equivalente a cookies HttpOnly. Uma futura evolução poderá migrar a sessão
para cookie HttpOnly/SameSite com política adequada entre Netlify e Blitz.
Esta correção não muda as regras de exclusão, as migrações Flyway ou o backend.

## Correção — Preflight CORS bloqueando `DELETE` na página de gerenciamento (24/10/2026)

### Sintoma observado

O login e a listagem de projetos/workspaces funcionam, mas a exclusão pelo navegador falha
em `OPTIONS` antes de enviar o `DELETE` ao backend: `Response to preflight request
... does not have HTTP ok status`. A interface mostra uma mensagem genérica de
falha de conexão. **Isso não demonstra que o projeto foi excluído**.

### Compatibilidade sem remover as rotas REST

A API mantém os quatro endpoints HTTP `DELETE` e adiciona aliases explícitos via
`POST` que invocam exatamente o mesmo `BoardDeletionService` (com autenticação,
verificação do proprietário, `@Transactional`, integridade e retornos `204/404/409`):

| Método do navegador | Endpoint |
| --- | --- |
| `POST` | `/api/projects/{projectId}/tasks/{taskId}/delete` |
| `POST` | `/api/projects/{projectId}/columns/{columnId}/delete` |
| `POST` | `/api/projects/{projectId}/delete` |
| `POST` | `/api/workspaces/{workspaceId}/delete` |

O `POST` é uma alternativa para o navegador quando a combinação de preflight,
camadas de segurança e/ou proxy impede o método DELETE. A origem específica do
bloqueio no caminho HTTP ainda requer inspeção da resposta OPTIONS no Network;
**não foi identificada uma falha do PostgreSQL**. A interface de gerenciamento
usa os novos `POST`, sem tentativa de `DELETE` automática. Caso a API não tenha
recebido o deploy, uma resposta `405` indica rota ausente. O acesso é autenticado
por Bearer e **não existe exclusão automática**.

### Diagnóstico do frontend

O console registra `[Orquestria][gerenciar] requisicao`, `resposta`,
`falha_de_rede_ou_cors` e, quando aplicável,
`exclusao_confirmada_releitura_falhou`. Os logs incluem apenas nome da operação,
método e status, sem e-mail, token, senha, corpo ou IDs dos recursos.

Para localizar o botão de tarefa, clicar **Ver colunas e tarefas** no projeto.
Quando a consulta falha, a tela mostra erro e opção **Tentar novamente**, em vez
de permanecer indefinidamente em "Carregando". Se a exclusão for confirmada
pelo servidor mas a releitura falhar, a interface informa que **a exclusão já
aconteceu**, evitando repetir a ação inadvertidamente.

### Publicação e validação manual

1. Commitar os arquivos preservando caminhos e esperar que o Blitz publique as novas rotas Java **antes** de testar o frontend no Netlify.
2. Abrir `/gerenciar` autenticado em **conta pessoal de teste**; clicar em **Ver colunas e tarefas** no projeto de teste.
3. Criar uma tarefa descartável no Kanban e confirmar a exclusão na página de gerenciamento. No Network, a chamada deve ser `POST .../tasks/{taskId}/delete` e retornar `204`.
4. Excluir uma coluna já vazia e depois um projeto **descartável**; conferir `204` e atualização da listagem.
5. Excluir um workspace vazio; confirmar `204`. Workspace com projeto e coluna com tarefas continuam impedidos (`409`).
6. Conferir que um token inválido recebe `401` e que os recursos de outra conta não podem ser excluídos (`404`).
7. Em caso de falha, copiar do console somente `[Orquestria][gerenciar] ...` e, do Network, `Request Method`/`Status Code` da requisição de teste — **nunca o Authorization nem o Payload**.

### Limitações

As operações ainda ficam em `/gerenciar`; integração dos botões diretamente
no Kanban e testes de concorrência completos continuam pendentes na Etapa 6.
Não há alteração em Flyway, PostgreSQL, tokens ou login. A validação completa de
build do repositório e o preflight real no Blitz dependem do deploy.
