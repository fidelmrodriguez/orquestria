# Colaboração por projeto

O compartilhamento do Orquestria é por **projeto**, não por workspace inteiro. A conta que criou o projeto é o **admin**; os usuários selecionados em **Equipe** para aquele projeto tornam-se **membro-admin** imediatamente, sem e-mail nem aceite de convite.

## Adicionar alguém

1. Entre com uma conta pessoal, abra o projeto desejado e acesse **Membros da equipe**.
2. Confira o **workspace e o projeto** no seletor **Projeto que será compartilhado**. A tela identifica os dois separadamente, para não confundir projetos de nomes iguais.
3. Pesquise pelo nome ou `@usuário` de uma conta existente (ao menos dois caracteres) e selecione o resultado. A lista inclui o proprietário como **admin** e os outros participantes como **membro-admin**.
4. Na próxima atualização do quadro (ou ao entrar novamente), o usuário encontrará **Workspaces convidados** na sidebar, com apenas o projeto para o qual recebeu permissão.

A inclusão não disponibiliza os outros projetos daquele workspace nem concede acesso às rotas `/api/workspaces/{id}` do proprietário.

## Permissões

| Operação | Admin (proprietário) | Membro-admin (colaborador) |
| --- | --- | --- |
| Visualizar e editar tarefas, comentários e colunas | Sim | Sim |
| Criar e reorganizar tarefas e colunas | Sim | Sim |
| Renomear ou excluir o projeto compartilhado | Sim | Sim |
| Adicionar ou remover pessoas no projeto | Sim | Não |
| Criar/excluir o workspace do proprietário | Sim | Não |
| Visualizar outros projetos do workspace sem compartilhamento | Sim | Não |

Excluir o projeto é uma operação irreversível para todos os participantes e continua exigindo confirmação. A exclusão do workspace inteiro permanece restrita ao proprietário, porque pode conter projetos que não foram compartilhados.

## Remoção e atribuições

O admin pode remover participantes pela mesma página **Equipe**. Se houver tarefas atribuídas à pessoa **nesse projeto**, é necessário reatribuí-las antes da remoção. Remover um vínculo revoga imediatamente o acesso às rotas do projeto; a conta pessoal não é excluída.

Contadores de membros, responsáveis disponíveis, filtros e avatares do Kanban usam **somente os participantes do projeto ativo**, não a antiga lista global de equipe do workspace. A lista global legada não concede acesso a novos projetos. A API só aceita atribuir novos responsáveis quando são o proprietário ou participantes explícitos daquele projeto.

O catálogo de tags continua pessoal. As tags gravadas nas tarefas compartilhadas são visíveis a quem tem acesso a essas tarefas.

## Modelo de segurança

- Flyway **V10** cria `project_members(project_id, member_id)` com chaves estrangeiras e índice de consulta.
- O proprietário é identificado por `projects.owner_id`; o vínculo em `project_members` concede a permissão `membro-admin` somente naquele projeto.
- A API lista projetos convidados separadamente em `GET /api/projects/invited`.
- `GET /api/projects/{projectId}/members` mostra participantes apenas a usuários autorizados.
- `POST /api/projects/{projectId}/members` e `POST /api/projects/{projectId}/members/{memberId}/remove` verificam a propriedade no servidor; usuários convidados não podem gerenciar participantes.
- Leitura e escrita de tarefas, comentários, colunas, renomeação e exclusão de projetos usam verificação de acesso no backend. Projetos não compartilhados respondem como inexistentes.
- As rotas próprias de workspace não concedem acesso ao convidado.

Ao publicar, o backend precisa aplicar a migração V10 antes de o frontend começar a consultar os novos endpoints. As regras devem ser validadas com duas ou mais contas independentes.

**Contas cadastradas anteriormente na lista global de equipe:** esses vínculos não são convertidos automaticamente em convites. Para conceder acesso, selecione cada projeto na página Equipe e adicione o usuário explicitamente.

## Compatibilidade durante o deploy

O frontend pode ficar publicado antes do backend novo. Se `GET /api/projects/invited`
retornar **400 — “Parâmetro inválido.”**, a versão antiga da API está tratando
`invited` como um UUID na rota `/api/projects/{id}`. Isso não é um erro de login.

Para evitar que o Kanban inteiro fique indisponível durante a atualização, o
frontend carrega temporariamente apenas os workspaces e projetos próprios quando
esse endpoint ainda não existe. Nesse modo, a lista de convidados e o cadastro de
participantes **não** funcionam; o fallback não concede acesso a nenhum projeto.
Erros de autenticação, permissão e falhas reais de servidor não são ignorados.

Para habilitar colaboração de verdade:

1. Confirme que o **backend** do Blitz foi implantado a partir do commit que contém
   `ProjectMembershipController`, `ProjectMembershipService` e `OwnershipGuard`
   com autorização de membros.
2. Verifique nos logs de inicialização do backend que a migração Flyway
   `V10__project_collaboration.sql` foi aplicada com sucesso.
3. Teste com uma sessão autenticada: `GET /api/projects/invited` deve devolver
   **200** e um array JSON (`[]` quando não há projetos convidados).
4. Depois, atualize o frontend e teste duas contas independentes; apenas o projeto
   explicitamente compartilhado deverá aparecer para o membro-admin.

**Não rode a migração manualmente no Neon nem apague tabelas para resolver o 400.**
O Flyway aplica a V10 no startup do backend atualizado.
