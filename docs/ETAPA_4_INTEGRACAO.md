# Etapa 4 — Integração do Kanban principal à API Java

O objetivo desta entrega é usar os mesmos dados do PostgreSQL no Kanban principal e na página de diagnóstico, sem trocar o design do frontend.

## Fluxo de dados

1. Após o login demonstrativo, `useBootstrapBoard` chama `loadRemoteBoard` quando a variável `NEXT_PUBLIC_ORQUESTRIA_API_URL` está preenchida.
2. O frontend consulta workspaces e projetos e, para cada projeto, as colunas e tarefas. Os dados são adaptados para os componentes existentes.
3. As ações de criar workspace/projeto/coluna/tarefa, renomear, editar, comentar e movimentar chamam a API Java por HTTPS.
4. Após gravar, o frontend consulta os dados novamente. Se uma chamada falhar, mostra um aviso visível e não registra a alteração como persistida.
5. O `localStorage` **não é fonte de dados de negócios** no modo Java. O estado de login fictício, tema e filtros continua no navegador. O modo local anterior só funciona se a variável de API estiver ausente.

A API Java recebeu endpoints de edição e comentários, mais uma migração Flyway V3 que conserva os registros existentes.

## Como validar via navegador (sem instalar IDE)

### 1. Backend no Blitz

- No histórico de deploy, confirme que a versão com `V3__task_details_comments.sql` foi publicada.
- Nos logs, procure `Successfully applied 1 migration ... now at version v3` na primeira execução (nas seguintes a migração já estará aplicada).
- Abra `https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health` e confirme `UP`.
- Se a API ficar temporariamente 502 enquanto inicia, acompanhe os logs antes de fazer um novo commit.

### 2. Frontend no Netlify

- Confirme a variável de build `NEXT_PUBLIC_ORQUESTRIA_API_URL=https://orquestria-api.fidelmrodriguez.blitz.cloud` e publique a nova versão.
- Acesse `https://orquestria.netlify.app/` e entre usando o acesso **demonstrativo**.
- O quadro deve mostrar os mesmos projetos que foram cadastrados em `/diagnostico/`, sem importar automaticamente as antigas tarefas da DummyJSON.
- Crie um workspace e projeto, depois colunas e uma tarefa; atualize a página (F5) e confira os registros.
- Edite o título, descrição, prazo e prioridade; adicione comentário e mova a tarefa para outra coluna; atualize com F5 para verificar persistência.
- Em caso de erro, procure o aviso vermelho no quadro e use **Atualizar do servidor**; o console do navegador fornece detalhes da requisição.

### 3. Limitações para entrevistas e portfólio

- A aplicação não tem usuários reais nem autenticação no servidor; todo visitante da demonstração acessa o mesmo conjunto de registros. Use **apenas dados fictícios**.
- Ações de exclusão, permissões, auditoria e política de limpeza do banco ainda não foram implementadas.
- O site exportado estaticamente não hospeda Java; Netlify, Blitz e Neon são serviços distintos.
- A eventual manutenção automática será feita **em outra etapa e em commit isolado**. Esta entrega não agenda nenhum processo e não exclui registros antigos.

## Erros comuns

| Sintoma | O que conferir |
| --- | --- |
| `Failed to fetch` | URL da API em variável do Netlify, CORS e serviço Blitz online |
| `404` no novo endpoint | Backend antigo ainda publicado; aguarde ou refaça o build do Blitz |
| `405 Method Not Allowed` | Método HTTP do frontend e versão atual do controller no Blitz |
| `502 Bad Gateway` | Spring Boot iniciando ou reiniciando; confira logs do Blitz |
| Nenhum projeto no quadro | Confirme no `/diagnostico/` se existem registros e verifique a conexão |

## Datas opcionais no Kanban

Tarefas podem ser criadas sem data de vencimento. A API devolve `dueDate: null` nesse caso e o frontend representa o prazo ausente como uma string vazia. O cartão mostra **Sem prazo**, sem tentar formatar uma data inválida. O utilitário `formatDate` também retorna um valor alternativo para datas ausentes ou inválidas, evitando que um cartão derrube o quadro inteiro.

Para validar no Netlify: abra **Projetos sem workspace**, selecione um projeto com tarefa sem vencimento e confirme que o Kanban carrega. Edite uma tarefa com prazo e recarregue com F5; a data válida deve continuar sendo exibida. Essa correção afeta apenas o frontend, sem migração do banco ou modificação da API.

## Feedback de gravação e atualização

No modo conectado ao Spring Boot, o quadro utiliza um **overlay com carregamento centralizado** durante requisições de gravação (workspaces, projetos, colunas, tarefas, comentários e movimentação) e na atualização manual dos dados. O modal mostra a operação atual e impede novos cliques até que a API responda e os dados sejam recarregados.

O carregamento usa o estado `remoteLoading` do Zustand, sem tempos de espera artificiais. Mesmo em caso de erro, o indicador desaparece no bloco `finally` e a mensagem de falha permanece visível no quadro. No modo local demonstrativo, esse overlay não aparece.

**Teste no Netlify:** abra um projeto, crie/edite/mova uma tarefa e verifique se o overlay aparece durante o envio. Após a resposta, ele deve desaparecer; atualize a página (F5) e confira que os dados permanecem. Use **Atualizar do servidor** para verificar a mensagem de atualização. Nenhuma mudança no backend ou no banco é necessária para este ajuste.
