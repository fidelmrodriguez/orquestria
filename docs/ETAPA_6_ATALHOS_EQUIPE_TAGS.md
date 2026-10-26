# Etapa 6 — Ações contextuais, equipe e tags

## Integração feita diretamente nos componentes originais

- Drawer de tarefa (`TaskDetailPanel`): botão **Excluir tarefa**, confirmação e atualização do quadro após HTTP 204.
- Cabeçalho de coluna (`BoardColumn`): lixeira por ID real; botão desabilitado quando há tarefas **mesmo que estejam ocultas por filtros**.
- Sidebar desktop e mobile (`WorkspaceNavigation`/`ProjectNavigation`): ações por ID real, evitando confundir projetos com nomes iguais. Projeto exige digitar **EXCLUIR**, pois também remove suas colunas, tarefas e comentários; workspace exige **EXCLUIR** e só pode ser removido depois que seus projetos acabarem.
- `AppShell`: removida a coluna **Atividade ao vivo**.
- Sidebar (`Sidebar`): acesso nativo a `/gerenciar`, `/equipe` e `/tags`, sem injeção de botões flutuantes. A página `/gerenciar` não foi alterada.

## Equipe

- `/equipe` é o formulário de equipe da conta pessoal, com busca por nome ou `@username` de **usuários cadastrados de verdade** (mínimo de dois caracteres).
- Dropdown com sugestões do backend `/api/users/search`, excluindo Guest e o próprio usuário; sem e-mail exposto ou dados de credenciais.
- Chips azuis mostram os membros atuais. Não é possível adicionar a mesma conta duas vezes.
- Para adicionar: `POST /api/team/members` `{ "userId": "uuid" }`; para remover: `POST /api/team/members/{id}/remove`. A API verifica a identidade do proprietário.
- Uma equipe pertence à **conta proprietária**, sendo reutilizada como lista de responsáveis em todos os workspaces dessa conta. Não há concessão automática de acesso aos workspaces ou projetos. **Colaboração/acesso compartilhado entre contas não é parte desta entrega.**
- O backend valida novos responsáveis: apenas o proprietário ou membro pertencente à equipe. Não permite inventar IDs.
- **Não se pode remover um membro que ainda esteja atribuído a tarefas do proprietário**. Reatribua essas tarefas antes da remoção, para manter integridade. Remover membro **não exclui a conta do usuário**.
- No ambiente Guest a lista de equipe adicional é vazia e não permite gerenciar membros. Seu próprio usuário continua disponível para atribuição.
- Persistência: Flyway **V6** (`team_members`), com chave composta e vínculos de FK.

## Tags

- `/tags`: catálogo por conta persistido em PostgreSQL; inclusão, edição e remoção por chips azuis, com verificação de nomes duplicados ignorando maiúsculas/minúsculas.
- Em **Criar tarefa** e **Detalhes da tarefa**, o campo agora usa o mesmo input de chips: Enter/vírgula adicionam; lápis edita; `×` remove.
- Digitar parte de uma tag abre sugestões de tags registradas naquela conta. Selecionar uma reutiliza sua grafia canônica, sem criar duplicata.
- Tags novas adicionadas ou renomeadas no drawer também são cadastradas no catálogo, para sugestões futuras. O cadastro usa `/api/tags` (GET, POST, POST rename/remove).
- Flyway **V7** cria o catálogo e índice único `(owner_id, lower(name))`; **V8** importa tags já existentes nas tarefas para que o autocomplete reconheça nomes anteriores à atualização.
- Limites: 32 caracteres por tag, 12 tags por tarefa, 100 tags no catálogo da conta. Vírgulas não fazem parte do nome de tag.
- **Renomear/remover uma tag em `/tags` não reescreve retroativamente o histórico das tarefas**. Para alterar a tag de uma tarefa, use o campo no próprio drawer.
- O catálogo da conta Guest é compartilhado entre visitantes Guest; contas pessoais têm catálogos isolados.

## Segurança e confirmação

- Excluídos via endpoints POST `/delete` já presentes na Etapa 6, mantendo checagem de proprietário no Java.
- Modal de confirmação é portal em `document.body`, sem ser cortado pelo scroll/backdrop da sidebar ou do drawer.
- Projeto/workspace exigem a confirmação digitada; guest exige confirmação digitada também nas outras exclusões.
- As falhas 409 (item com dependências, membro com tarefas), 401/403 (sessão ou permissão), 404 e erros de rede não podem ser tratados como sucesso.
- Operações bem-sucedidas atualizam o Zustand com `reloadRemote()` e preservam o login.

## Publicação em nuvem

1. Faça o commit dos arquivos no mesmo repositório, mantendo os caminhos relativos.
2. Confira o deploy da API no Blitz: as migrações V6 → V7 → V8 devem executar antes de testes de equipe/tags.
3. Confirme o deploy do frontend no Netlify, que continua sendo Next.js estático (`output: "export"`).
4. Login em **duas contas pessoais**: na primeira, pesquise a outra por username e adicione na equipe; confira o dropdown de responsáveis ao criar/editar tarefa.
5. Crie tarefa atribuída ao membro e confirme que a tentativa de removê-lo mostra bloqueio; reatribua ao dono e depois remova o membro.
6. Cadastre tag, digite parte dela numa nova tarefa e selecione a sugestão; faça edição e remoção de chips no drawer; confira persistência após F5.
7. Use filtro para esconder tarefas de uma coluna e confirme que **a exclusão dela continua bloqueada**; depois esvazie a coluna e exclua com a lixeira.
8. Exclua uma tarefa descartável pelo drawer; projeto e workspace descartáveis pela sidebar. Não use dados reais nos testes destrutivos.
9. Confira que `/gerenciar` continua operando; que a coluna Atividade ao vivo desapareceu; e que o gate de preparação do Blitz segue com contador.

**Validação disponível neste ambiente:** parsing dos Java, transpile sintático dos TS/TSX e testes das regras puras de tags. Não foi possível rodar `mvn test` ou `npm run build` por falta das dependências e acesso à rede neste ambiente. Os deploys e testes fim-a-fim precisam ser confirmados no Blitz e no Netlify antes de considerar a alteração operacionalmente aprovada.
