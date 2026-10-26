# Etapa 7 — Testes automatizados e integração contínua

**Status:** implementação inicial entregue; conclusão condicionada ao GitHub Actions ficar verde.

## Objetivo

Evidenciar, de forma reproduzível, que o Orquestria compila e respeita as regras de autenticação, isolamento de contas, CRUD, equipe e tags. O banco de produção **nunca** participa dos testes.

## O que entra nesta entrega

1. Workflow `.github/workflows/ci.yml`, executado em `push` e `pull_request` para `main` (ou pelo botão `Run workflow`).
2. Job **backend** com Java 21, Maven e PostgreSQL 16 descartável, com Flyway V1–V8 e validação de schema pelo Hibernate.
3. Testes unitários Java que já existiam + novos testes HTTP com Spring Boot e MockMvc, exercitando PostgreSQL real:
   - `/actuator/health` público; APIs privadas exigem Bearer;
   - cadastro, login por nome/e-mail, logout e sessões independentes;
   - dois usuários: listagem privada, GET e exclusão de recursos de outro proprietário retornam 404;
   - bloqueio de coluna com tarefas e workspace com projetos (409); exclusão permitida após remover dependências (204);
   - diretório de usuários reais, membros duplicados, remoção de membro com tarefas atribuídas, validação de responsáveis;
   - catálogo de tags: sugestão, nomes duplicados, renomeação, exclusão e isolamento por usuário;
   - aplicação das migrações V1–V8.
4. Cobertura Java com JaCoCo (`backend/target/site/jacoco/index.html`) e anexos dos relatórios no GitHub Actions.
5. Job **frontend** com Node 22: `npm ci`, `npm run typecheck`, `npm test -- --runInBand --ci`, `npm run build`.

## Publicação: como testar sem rodar nada no computador

1. No GitHub, envie **somente os arquivos deste ZIP**, nas pastas exatas. Não substitua outras alterações da Etapa 6.
2. Abra **GitHub → Actions → Orquestria CI** e selecione o workflow do commit (ou `Run workflow`).
3. Aguarde dois checks: **Backend - Java 21 / PostgreSQL** e **Frontend - Next.js / TypeScript / Jest**.
4. Ambos precisam aparecer verdes. Se ficarem vermelhos, abra o job, expanda a etapa que falhou e copie as primeiras linhas do erro real. Não aplique mudanças aleatórias no banco.
5. Em `Artifacts`, baixe `backend-test-results` para consultar os XMLs do Surefire e o HTML do JaCoCo.
6. O deploy da API e o Netlify devem permanecer iguais: este ZIP não altera endpoints de produção, tabelas, dados reais, layout, sessão ou o mecanismo de wake-up.

## Configuração e segurança

O job backend cria um serviço `postgres:16-alpine` chamado `orquestria_test` e usa credenciais locais descartáveis (`DB_URL`, `DB_USER`, `DB_PASSWORD`). **Não preencha os Secrets de produção ou a URL do Neon neste workflow.**

Testes de integração com banco são ativados apenas quando `ORQUESTRIA_RUN_DB_TESTS=true`; sem essa variável, continuam os testes unitários. A variável é definida automaticamente pelo workflow, que fornece o PostgreSQL antes de executar `mvn verify`. As classes de integração não usam serviços externos, e os usuários/projetos criados vivem apenas até o descarte do container.

## Comandos executados pelo GitHub Actions

```bash
# backend (com PostgreSQL do job)
mvn --batch-mode --no-transfer-progress verify

# frontend
npm ci
npm run typecheck
npm test -- --runInBand --ci
npm run build
```

## Definição de pronto

- [ ] Job backend verde: todos os testes e migrações concluídos.
- [ ] Job frontend verde: TypeScript, Jest e exportação estática do Next.js concluídos.
- [ ] Nenhuma regressão nos dois cenários já validados pelo usuário: exclusões e separação entre contas.
- [ ] Resultados anexados e verificáveis no histórico do GitHub Actions.

> Observação: análise sintática dos arquivos novos e integridade do ZIP foram verificadas ao criar esta entrega, mas não foi possível executar Maven/Node com dependências completas no ambiente de geração. O GitHub Actions é a validação real dessa entrega; não confundir implementação do pipeline com pipeline aprovado.

## Próximo passo

Quando os dois checks estiverem verdes, podemos dar a Etapa 7 como validada e avançar à Etapa 8 (acessibilidade, responsividade e experiência de uso). Se um check falhar, corrigimos a causa com base no log e repetimos o pipeline antes de avançar.
