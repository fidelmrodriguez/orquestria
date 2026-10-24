# Publicação do Orquestria na nuvem

A aplicação utiliza serviços separados:

- **Frontend:** Netlify — `https://orquestria.netlify.app/`
- **API Java:** Blitz — `https://orquestria-api.fidelmrodriguez.blitz.cloud/`
- **PostgreSQL:** Neon (branch `production`, banco `neondb`)

## Backend (Blitz)

O Blitz está conectado à branch `main` do repositório GitHub e usa:

- `Folder to build`: `backend`
- `Dockerfile`: `Dockerfile`
- `Start command`: vazio (a imagem define o comando)
- Banco do Blitz: desativado, pois o banco fica no Neon

Variáveis de ambiente privadas no Blitz:

| Variável | Formato esperado |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://HOST/neondb?sslmode=require` |
| `DB_USER` | usuário do Neon |
| `DB_PASSWORD` | senha do Neon |

As credenciais não devem ser versionadas no GitHub, nem inseridas no Next.js.

## Frontend (Netlify)

O Netlify publica exclusivamente a pasta `frontend/` com exportação estática do Next.js.
A variável `NEXT_PUBLIC_ORQUESTRIA_API_URL` aponta para a URL HTTPS do Blitz, sem `/` final.
Depois de alterar uma variável de build do Netlify, execute um novo deploy.

## Testes sem IDE

1. Acesse `https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health`.
2. Abra `https://orquestria.netlify.app/diagnostico/`.
3. Clique em **Verificar conexão e atualizar dados**.
4. Crie um workspace, projeto, coluna e tarefa com dados fictícios.
5. Atualize a página e consulte novamente. Se os dados permanecerem, a API está gravando no Neon.
6. Mova a tarefa para outra coluna, atualize a página e confira a coluna retornada.

Nos logs do Blitz, verifique a inicialização do Spring Boot e as migrações do Flyway.
A migração V2 não remove projetos existentes; ela acrescenta tabelas e uma relação opcional de workspace.

## Avisos

- O plano gratuito pode suspender a API por inatividade. A primeira requisição após suspensão pode levar mais tempo.
- A API ainda não implementa autenticação e autorização. Use apenas dados de teste.
- A página de diagnóstico é separada do quadro Kanban principal, que permanece demonstrativo nesta etapa.
- O arquivo `render.yaml` permanece como configuração legada; não é usado pelo Blitz.
