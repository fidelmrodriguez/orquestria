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
NEXT_PUBLIC_ORQUESTRIA_API_URL=https://orquestria-api.fidelmrodriguez.blitz.cloud
```

A variável faz parte do JavaScript entregue ao navegador. **Não utilize variáveis públicas para segredos**, credenciais do Neon ou tokens administrativos. Mudanças nesse valor exigem um novo build.

## Prontidão do backend

O arquivo `frontend/public/_redirects` configura o proxy:

```text
/api/orquestria-readiness  https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health  200!
```

Ao abrir a aplicação, o frontend consulta `/api/orquestria-readiness` no próprio domínio do Netlify. A regra encaminha a requisição para o health do Spring Boot, evitando uma consulta cruzada direta nessa verificação.

A interface é liberada somente quando a resposta indica `status: "UP"`. Até lá, o usuário vê **Preparando seu ambiente**, com um contador de tempo decorrido e novas verificações automáticas. Respostas HTML ou erros de gateway não são confundidos com disponibilidade. A aplicação não depende de uma rota Next.js dinâmica no ambiente de produção.

A suspensão por inatividade é uma característica da hospedagem da API; o proxy melhora a experiência de inicialização, mas não impede que a API volte a dormir.

## Verificações de publicação

- Confirmar que o build exportou a pasta `out/` e que os recursos estáticos carregam.
- Abrir `/api/orquestria-readiness` e verificar `status: "UP"` quando a API estiver pronta.
- Verificar que o login ou a sessão existente aparece após a disponibilidade da API.
- Conferir chamadas autenticadas a `/api/auth/me` e acesso aos workspaces do usuário.

Para arquitetura e execução da interface, consulte [Frontend](../frontend/README.md). Para a infraestrutura de backend e banco, consulte [Deploy da API](DEPLOY_CLOUD.md).
