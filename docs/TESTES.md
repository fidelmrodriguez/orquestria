# Testes e integração contínua

O Orquestria utiliza testes de frontend e backend, além de verificações automáticas executadas pelo workflow `.github/workflows/ci.yml`.

## Estratégia de testes

| Área | Ferramentas | Escopo |
| --- | --- | --- |
| Frontend | Jest e React Testing Library | Componentes, login, gerenciamento e comportamento da interface |
| Backend | JUnit 5 e Spring Boot Test | Serviços, validações, segurança e testes HTTP |
| Banco de testes | PostgreSQL 16 e Flyway | Migrações e integração dos endpoints com persistência real |
| Cobertura Java | JaCoCo | Relatórios publicados como artefatos da execução de CI |

## CI no GitHub Actions

O workflow **Orquestria CI** é acionado em `push` e `pull_request` para `main` e permite execução manual por `workflow_dispatch`.

**Job backend**

- Prepara Java 21 e PostgreSQL 16 temporário.
- Executa `mvn verify`, incluindo testes unitários, integração com banco e relatórios JaCoCo.
- Publica resultados do Surefire e relatórios de cobertura como artefatos.

**Job frontend**

- Prepara Node.js 22 e instala dependências com `npm ci`.
- Executa checagem TypeScript, Jest e build estático do Next.js.

Os dois jobs são independentes. Uma execução só deve ser considerada aprovada quando **ambos terminam com sucesso**. A presença do workflow no repositório ou a aprovação de apenas um job não equivale à aprovação da execução completa.

## Documentação e release

A etapa de frontend do CI também executa `node ../scripts/check-doc-links.mjs` para localizar links relativos quebrados nos arquivos Markdown do repositório. A verificação não depende de conexão com serviços externos e não valida links HTTP.

A validação funcional antes de marcar uma versão segue o [checklist de publicação](RELEASE.md). O sucesso do CI **não** confirma sozinho que o ambiente publicado e os fluxos de negócio foram testados.

## Comandos

```bash
# Backend (executar dentro de backend/)
mvn test
mvn verify

# Documentação (executar na raiz do repositório)
node scripts/check-doc-links.mjs

# Frontend (executar dentro de frontend/)
npm ci
npm run typecheck
npm test -- --runInBand --ci
npm run build
```

Para estrutura e execução por camada, consulte [Frontend](../frontend/README.md) e [Backend](../backend/README.md).

Os testes Java que dependem de PostgreSQL utilizam `ORQUESTRIA_RUN_DB_TESTS=true` e credenciais `DB_*` apontando para o banco de testes. No GitHub Actions, essas variáveis são fornecidas pelo serviço PostgreSQL descartável do job.

**Não use a URL do Neon de produção nesses testes.**

## Critérios de qualidade

- Testes de autenticação e isolamento entre contas, inclusive operações de exclusão e remoção de comentário vinculado a outra conta.
- Migrações do banco reproduzíveis em um PostgreSQL limpo.
- Formulários e componentes críticos verificados por testes de frontend.
- TypeScript sem erros e build estático concluído.
- Logs e relatórios disponíveis para investigar falhas antes de integrar novas alterações.

Os testes da camada de operação verificam o identificador de requisição, os cabeçalhos de não-cache, a normalização de respostas de erro e o comportamento seguro do frontend quando recebe HTML da hospedagem.

Os resultados correntes do pipeline podem ser consultados na [aba Actions](https://github.com/fidelmrodriguez/orquestria/actions); este documento não presume que a execução mais recente esteja aprovada.

## Colaboração por projeto

Os testes HTTP sobre PostgreSQL validam o isolamento entre projetos privados e compartilhados: um membro-admin só enxerga o projeto ao qual foi adicionado, pode operar colunas e tarefas desse projeto, não acessa o workspace do proprietário e não pode adicionar/remover membros. A revogação de acesso é imediata. Os testes de Flyway validam também a migração V10.

## Participantes por projeto e criação de tarefas

- O teste `frontend/src/lib/project-members.test.ts` confere que participantes de um projeto não são herdados pelos demais projetos do mesmo workspace.
- Os testes de propriedades e filtros usam a lista de participantes do projeto selecionado.
- A integração HTTP com PostgreSQL confere que um usuário presente na equipe legada **não pode ser atribuído** a uma tarefa sem o vínculo explícito em `project_members`.
- Conferir manualmente no Netlify: abrir e fechar o modal de nova tarefa, conferir a lista de membros por projeto, alternar projetos no mesmo workspace e adicionar a primeira tag sem faixa vazia.

## Regressão de duplicação e formulários de tarefas

1. No Kanban, duplicar um cartão com título, descrição, tags, prioridade, responsável, prazo e comentário. Conferir que a cópia aparece abaixo, tem outro UUID, preserva o conteúdo e que cada comentário copiado também tem novo UUID.
2. Atualizar a página e conferir que a ordem da coluna permanece. Tentar duplicar uma tarefa de projeto privado com outra conta: a API deve responder `404` e não criar cópia.
3. Comparar os drawers de criação e edição: largura, campos de seleção, prazo e tags devem ser idênticos; somente a edição apresenta comentários. O título na edição é um heading com ação Editar.
4. Em Tags, verificar inclusão por Enter e por botão, com mensagem de espera durante chamada à API; em Equipe, conferir tooltip e texto não selecionável; no cabeçalho, conferir o placeholder Buscar.
5. Diagnóstico do `401` ao duplicar: verificar que o frontend consulta `GET /api/auth/me` **uma única vez após a recusa**, sem reenviar o `POST /duplicate`. Se `/me` retornar 200, a sessão permanece ativa e o Kanban mostra erro sem criar cópia local; se `/me` retornar 401/403, somente o token que falhou é removido. Se `/me` falhar por rede/5xx, a sessão é preservada.
6. No console, localizar `[Orquestria][auth] Operação recusada` com `operacao=duplicar_tarefa`, `sessao` e `requestId`, sem copiar credenciais. No Blitz, correlacionar pelo `rid` a linha `duplicacao_tarefa bearer=valido|ausente_ou_malformado|invalido_revogado_ou_expirado`. Um Bearer válido com 401 na duplicação exige investigação adicional da implantação/proxy; um Bearer inválido exige login novamente.
