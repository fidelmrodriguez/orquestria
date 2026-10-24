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
| `APP_GUEST_PASSWORD` | Senha do guest (opcional antes do primeiro bootstrap; valor-padrão público no frontend) |

Não é preciso criar um banco no Blitz. O Flyway executa migrações pendentes V1–V4 ao iniciar. O bootstrap cria a conta guest e associa a ela registros preexistentes. Não exclua os dados do Neon. **Nunca inclua senha de banco no GitHub.**

## Frontend: Netlify

O Netlify publica `frontend/` como exportação estática (`out/`). A variável de build é:

```text
NEXT_PUBLIC_ORQUESTRIA_API_URL=https://orquestria-api.fidelmrodriguez.blitz.cloud
```

Essa variável é pública por natureza e deve conter somente a URL da API, nunca segredos. Alterá-la exige novo build no Netlify. Os endpoints de escrita dependem do backend atualizado no Blitz.

## Ordem recomendada para esta etapa

1. Faça um único commit contendo frontend, backend, README e docs.
2. Confira primeiro o build do Blitz, inicialização do Spring e aplicação da migração V3.
3. Depois confira o deploy publicado no Netlify, pois o novo frontend usa autenticação.
4. Teste `GET /actuator/health` (público); `GET /api/projects` sem token agora deve retornar `401`.
5. Entre com `guest` no Netlify, confira os dados antigos, cadastre outra conta e verifique que os projetos são privados.
5. Use [ETAPA_4_INTEGRACAO.md](ETAPA_4_INTEGRACAO.md) para os testes detalhados.

## Cuidados

- Os planos gratuitos podem suspender serviços por inatividade ou limitar recursos.
- A aplicação usa Spring Security; o guest é compartilhado, contas cadastradas são isoladas.
- Não expor tokens de sessão no GitHub, prints ou logs.
- Não inclua dados pessoais na conta pública guest.
- **Não há limpeza automática, exclusão periódica, agendador ou monitor de cotas nesta etapa.** Política de retenção será uma entrega separada.
- `render.yaml` é um arquivo legado da primeira tentativa de deploy e não participa da publicação no Blitz.
