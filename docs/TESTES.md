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

## Comandos

```bash
# Backend (executar dentro de backend/)
mvn test
mvn verify

# Frontend (executar dentro de frontend/)
npm ci
npm run typecheck
npm test -- --runInBand --ci
npm run build
```

Os testes Java que dependem de PostgreSQL utilizam `ORQUESTRIA_RUN_DB_TESTS=true` e credenciais `DB_*` apontando para o banco de testes. No GitHub Actions, essas variáveis são fornecidas pelo serviço PostgreSQL descartável do job.

**Não use a URL do Neon de produção nesses testes.**

## Critérios de qualidade

- Testes de autenticação e isolamento entre contas, inclusive operações de exclusão.
- Migrações do banco reproduzíveis em um PostgreSQL limpo.
- Formulários e componentes críticos verificados por testes de frontend.
- TypeScript sem erros e build estático concluído.
- Logs e relatórios disponíveis para investigar falhas antes de integrar novas alterações.

Os resultados correntes do pipeline podem ser consultados na [aba Actions](https://github.com/fidelmrodriguez/orquestria/actions); este documento não presume que a execução mais recente esteja aprovada.
