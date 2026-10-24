# Deploy do Orquestria na nuvem

**Netlify (Next.js)** → **Blitz (Java/Spring Boot)** → **Neon (PostgreSQL)**

## Backend: Blitz

O Blitz lê o repositório na branch `main`, com **Folder to build = `backend`**, `Dockerfile = Dockerfile`, e executa Java 21. As credenciais do Neon ficam somente nas variáveis do Blitz:

| Variável | Exemplo sem credenciais |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://HOST/neondb?sslmode=require` |
| `DB_USER` | Usuário do Neon |
| `DB_PASSWORD` | Senha do Neon |
| `APP_CORS_ALLOWED_ORIGIN` | `https://orquestria.netlify.app` (opcional; já é o padrão) |

Não é preciso criar um banco no Blitz. O Flyway executa migrações pendentes V1, V2 e V3 ao iniciar. **Nunca inclua senha de banco no GitHub.**

## Frontend: Netlify

O Netlify publica `frontend/` como exportação estática (`out/`). A variável de build é:

```text
NEXT_PUBLIC_ORQUESTRIA_API_URL=https://orquestria-api.fidelmrodriguez.blitz.cloud
```

Essa variável é pública por natureza e deve conter somente a URL da API, nunca segredos. Alterá-la exige novo build no Netlify. Os endpoints de escrita dependem do backend atualizado no Blitz.

## Ordem recomendada para esta etapa

1. Faça um único commit contendo frontend, backend, README e docs.
2. Confira primeiro o build do Blitz, inicialização do Spring e aplicação da migração V3.
3. Depois confira o deploy publicado no Netlify, pois o novo frontend utiliza endpoints novos.
4. Teste `GET /actuator/health`, `GET /api/projects` e as ações do quadro principal.
5. Use [ETAPA_4_INTEGRACAO.md](ETAPA_4_INTEGRACAO.md) para os testes detalhados.

## Cuidados

- Os planos gratuitos podem suspender serviços por inatividade ou limitar recursos.
- A aplicação é demonstrativa e não possui autenticação/isolamento de dados por usuário.
- Não inclua dados pessoais no banco de demonstração.
- **Não há limpeza automática, exclusão periódica, agendador ou monitor de cotas nesta etapa.** Política de retenção será uma entrega separada.
- `render.yaml` é um arquivo legado da primeira tentativa de deploy e não participa da publicação no Blitz.
