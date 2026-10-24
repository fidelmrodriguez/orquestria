# Etapa 2 — Publicação e integração na nuvem

O objetivo foi executar a API Java e o PostgreSQL sem exigir Java, Maven, Docker ou IDE instalados no computador. A interface já estava publicada no Netlify.

## Arquitetura adotada

```text
Navegador
   │
   ▼
Netlify — frontend Next.js / React
   │ HTTPS + JSON
   ▼
Blitz — API Java / Spring Boot
   │ JDBC + TLS
   ▼
Neon — PostgreSQL
```

- **Netlify:** publica `frontend/` como site estático e injeta a URL pública da API durante o build.
- **Blitz:** compila o Dockerfile da pasta `backend/` a partir da branch `main` do GitHub e executa o Spring Boot.
- **Neon:** hospeda o PostgreSQL; o Flyway aplica as migrações pendentes na inicialização do backend.

## Configurações usadas

No **Blitz**, o diretório de build é `backend` e o Dockerfile selecionado é `Dockerfile`. O banco próprio do provedor não é necessário, pois o banco está no Neon.

| Variável no Blitz | Uso |
| --- | --- |
| `DB_URL` | URL JDBC de conexão com PostgreSQL, com TLS |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco, armazenada como segredo |

No **Netlify**, `NEXT_PUBLIC_ORQUESTRIA_API_URL` aponta para `https://orquestria-api.fidelmrodriguez.blitz.cloud`. Essa variável contém **somente o endereço público** da API, nunca a senha do banco.

## Verificação pelo navegador

1. Consultar [a saúde da API](https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health) e confirmar `UP`.
2. Consultar `GET /api/projects` e verificar o retorno de uma lista JSON.
3. Abrir [a página de diagnóstico](https://orquestria.netlify.app/diagnostico/) no frontend.
4. Cadastrar um projeto fictício, consultar novamente e atualizar a página para verificar se a gravação permaneceu no PostgreSQL.

A primeira validação confirmou a aplicação Java iniciada, migração Flyway V1 aplicada, conexão com Neon e criação/consulta de um projeto pela interface hospedada no Netlify.

## Considerações de operação

- O plano gratuito pode suspender o serviço Java após um período sem requisições. O primeiro acesso pode demorar.
- Um `502` durante a inicialização não significa automaticamente erro de compilação; verificar os logs do Blitz ajuda a distinguir uma aplicação iniciando de uma falha de execução.
- A API começou sem autenticação: apenas dados fictícios na demonstração pública.
- Nenhum dado é apagado automaticamente. Uma futura política de retenção será tratada separadamente.

O guia operacional atualizado está em [DEPLOY_CLOUD.md](DEPLOY_CLOUD.md). A evolução dos domínios de trabalho aparece na [Etapa 3](ETAPA_3_KANBAN_API.md).
