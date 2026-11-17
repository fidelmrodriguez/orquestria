# Deploy do frontend no Netlify

O Orquestria utiliza Next.js 14 com `output: "export"`. O resultado do build é uma aplicação estática publicada pelo Netlify; a API Java permanece em outro serviço.

## Configuração de build

| Campo | Valor |
| --- | --- |
| Branch | `main` |
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `out` (a partir de `frontend/`) |

Esses valores constam de `netlify.toml` e `frontend/next.config.mjs`. A pasta gerada `frontend/out/` não deve ser versionada.

## Configuração pública da API

Defina no ambiente de build do Netlify:

```text
NEXT_PUBLIC_ORQUESTRIA_API_URL=https://orquestria-api.fidelmrodriguez.prod.page
```

A variável faz parte do JavaScript entregue ao navegador. **Não utilize variáveis públicas para segredos**, credenciais do Neon ou tokens administrativos. Mudanças nesse valor exigem um novo build.

## Prontidão do backend

O arquivo `frontend/public/_redirects` define o proxy nativo do Netlify, como no Monavero:

```text
/api/orquestria-readiness  https://orquestria-api.fidelmrodriguez.prod.page/actuator/health  200!
```

A pagina do Orquestria consulta essa rota no proprio dominio Netlify, sem navegar ate o Blitz. O Netlify encaminha a requisicao ao health da API e devolve a resposta original. **Nao existe mais Netlify Function para essa rota.** A interface so libera o uso quando recebe HTTP 200, JSON e `status: "UP"`; HTML de inicializacao nao conta como pronto. O proxy permite verificar sem CORS no navegador, mas **nao ha garantia de que o plano gratuito do Blitz acorde com esse tipo de requisicao**. A segunda verificacao direta da API depende do CORS autorizado no Spring.

A URL do destino do proxy e fixa neste arquivo; caso o dominio da API mude, atualize esta regra e a variavel `NEXT_PUBLIC_ORQUESTRIA_API_URL` para o mesmo host.

A interface é liberada somente quando a resposta indica `status: "UP"`. Até lá, o usuário vê **Preparando seu ambiente**, com um contador de tempo decorrido e novas verificações automáticas. Respostas HTML ou erros de gateway não são confundidos com disponibilidade. A aplicação não depende de uma rota Next.js dinâmica no ambiente de produção.

A suspensão por inatividade é uma característica da hospedagem da API; o proxy permite monitorar a inicialização, mas não impede que a API volte a dormir.

## Verificações de publicação

- Confirmar que o build exportou a pasta `out/` e que os recursos estáticos carregam.
- Abrir `/api/orquestria-readiness` e verificar que a rota entrega o JSON do Spring (quando pronto, `status: "UP"`). Durante o despertar, pode exibir HTML ou erros HTTP do Blitz.
- Confirmar que `out/_redirects` contém a regra para a URL HTTPS do Blitz, sem referência a `/.netlify/functions/`.
- Verificar que o login ou a sessão existente aparece após a disponibilidade da API.
- Conferir chamadas autenticadas a `/api/auth/me` e acesso aos workspaces do usuário.

Para arquitetura e execução da interface, consulte [Frontend](../frontend/README.md). Para a infraestrutura de backend e banco, consulte [Deploy da API](DEPLOY_CLOUD.md).
