# Deploy do backend e banco de dados

A API Java é executada no Blitz. O banco PostgreSQL é hospedado no Neon. A comunicação entre os serviços utiliza JDBC sobre TLS.

## Backend — Blitz

A publicação utiliza a branch `main`, a pasta `backend/` e seu `Dockerfile`.

| Configuração | Valor |
| --- | --- |
| Diretório de build | `backend` |
| Dockerfile | `backend/Dockerfile` |
| Runtime | Java 21 (definido no build da aplicação) |

Variáveis de ambiente necessárias no serviço:

| Variável | Descrição |
| --- | --- |
| `DB_URL` | URL JDBC do Neon, com SSL/TLS |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `APP_CORS_ALLOWED_ORIGIN` | Origem HTTPS permitida para chamadas do frontend |
| `APP_GUEST_PASSWORD` | Senha utilizada ao inicializar a conta guest, se aplicável |

As credenciais pertencem às configurações privadas do provedor e não devem ser armazenadas no Git ou copiadas para variáveis públicas do frontend.

## Banco — Neon

O Flyway executa as migrações pendentes ao iniciar o Spring Boot. As versões `V1` a `V8` fazem parte do repositório em `backend/src/main/resources/db/migration/`. Em bases já inicializadas, novas versões devem ser **acrescentadas**, sem reescrever migrações anteriores.

Para verificar a aplicação em produção, consulte o log de inicialização do Spring Boot e as informações de validação do Flyway. Nunca execute testes de integração destrutivos contra o banco de produção.

## Disponibilidade e saúde

A URL de saúde da API é:

`https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health`

No ambiente atual, o Blitz pode suspender o processo após inatividade. A interface publicada no Netlify aguarda a resposta `status: "UP"` para liberar a navegação e o login. Esse mecanismo **não mantém a API acordada permanentemente** e não garante um tempo fixo de inicialização.

Para diagnosticar indisponibilidade, separe falhas de build ou inicialização (logs do Blitz) de erros transitórios no processo de despertar. Uma resposta temporária de proxy ou gateway não significa necessariamente corrupção do banco.

## Ordem de publicação

Quando uma mudança envolve esquema ou contrato de API e interface, publique a versão compatível do backend e verifique as migrações antes de disponibilizar o frontend que depende delas.

O frontend é publicado separadamente; consulte [Deploy do frontend](DEPLOY_NETLIFY.md). O [GitHub Actions](TESTES.md) usa PostgreSQL temporário, nunca o Neon.
