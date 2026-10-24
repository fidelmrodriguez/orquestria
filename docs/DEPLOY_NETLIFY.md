# Publicação do frontend Orquestria no Netlify

O repositório contém um frontend Next.js/React funcional e a pasta `backend/` reservada para a futura API Java/Spring Boot. O backend **não participa** desta publicação.

## Configuração atual

A aplicação utiliza renderização no cliente, sem rotas de API/SSR próprias do Next.js. O `frontend/next.config.mjs` define `output: "export"`, que produz um site estático em `frontend/out/` com `npm run build`.

Na raiz do repositório, o `netlify.toml` define:

| Campo | Valor |
| --- | --- |
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `out` (relativo à base) |
| Node.js | `20` |
| `NETLIFY_NEXT_PLUGIN_SKIP` | `true` |

O deploy estático não precisa do adaptador SSR do Next.js. Não inclua a pasta `out/` no Git: ela será gerada no Netlify.

## Corrigindo a página 404 após deploy publicado

1. Substitua no repositório os arquivos `frontend/next.config.mjs`, `frontend/package.json`, `netlify.toml`, `README.md` e este documento pelos arquivos do pacote de correção.
2. Faça um commit e envie para `main`.
3. No painel do Netlify, abra **Project configuration → Build settings** e confira se a configuração efetiva usa `frontend` como base, `npm run build` como comando e `out` como publicação. Evite configurar `frontend/out` quando a base já é `frontend`.
4. Abra **Deploys** e execute **Trigger deploy → Clear cache and deploy site**, se a interface oferecer essa opção. Caso contrário, aguarde o deploy provocado pelo push.
5. No deploy, abra **Deploy File Explorer**. Confira a presença de `index.html` e `_next/` no diretório publicado. Depois teste a URL do site.
6. Quando a página funcionar, acrescente a URL ao README e ao campo **About / Website** do GitHub.

Se ainda aparecer 404, confira o **Deploy log**: precisa mostrar execução do Next.js e exportação para `out`. Verifique também se o último deploy usa a branch `main` e o commit corrigido.

## Execução local

```bash
cd frontend
npm ci
npm run dev
```

Acesse http://localhost:3000. Para verificar a geração de arquivos estáticos:

```bash
npm run build
# Deve gerar out/index.html
```

## Quando o backend Java estiver pronto

O Netlify continuará servindo o frontend estático. A API Spring Boot será hospedada separadamente. O navegador consumirá seus endpoints HTTPS, sujeitos a CORS, autenticação e configuração da URL da API.

> Se futuramente o frontend passar a usar recursos Next.js exclusivos de servidor, será necessário reavaliar `output: "export"` e a configuração de hospedagem.
