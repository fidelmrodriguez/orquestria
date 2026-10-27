# Colaboração por projeto

O compartilhamento do Orquestria é por **projeto**, não por workspace inteiro. A conta que criou o projeto é o **admin**; os usuários selecionados em **Equipe** para aquele projeto tornam-se **membro-admin** imediatamente, sem e-mail nem aceite de convite.

## Adicionar alguém

1. Entre com uma conta pessoal, abra o projeto desejado e acesse **Membros da equipe**.
2. Confira o projeto no seletor **Projeto que será compartilhado**.
3. Pesquise pelo nome ou `@usuário` de uma conta existente e selecione o resultado.
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
