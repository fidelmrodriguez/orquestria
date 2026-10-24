# Frontend do Orquestria — Netlify

A aplicação Next.js 14 é exportada como site estático e publicada separadamente da API Java.

| Campo | Configuração |
| --- | --- |
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `out` (relativo à base) |
| Branch | `main` |

`frontend/next.config.mjs` define `output: "export"`. Não comite a pasta `out/`.

## API Java em produção

No Netlify, em **Project configuration → Environment variables**, configure a variável pública de build:

```text
NEXT_PUBLIC_ORQUESTRIA_API_URL=https://orquestria-api.fidelmrodriguez.blitz.cloud
```

Após salvar uma variável, faça um novo deploy; a URL fica incorporada ao JavaScript estático. Não configure usuário/senha do PostgreSQL no Netlify.

O Kanban principal usa a API Java como fonte de dados quando a variável está presente. Se não estiver, o frontend executa o modo demonstrativo local com DummyJSON e Zustand. O backend Spring Boot não roda no Netlify.

Para validar, visite `https://orquestria.netlify.app/` e siga [ETAPA_4_INTEGRACAO.md](ETAPA_4_INTEGRACAO.md). A página `/diagnostico/` permanece como ferramenta auxiliar.

## Login real — Etapa 5

O Netlify mantém somente `NEXT_PUBLIC_ORQUESTRIA_API_URL`, que é pública. A tela de login traz o guest preenchido, enquanto usuários cadastrados usam suas próprias credenciais. O token retornado pelo backend é guardado em `sessionStorage`; nenhum segredo de banco é enviado ao frontend. O backend precisa estar atualizado com a migração V4 antes da nova versão do Netlify.
