# Correção do wake-up — Next.js estático + Netlify + Blitz

## Problema

O deploy do commit `3d05039` falhou na fase de build do Netlify (`exit code: 2`). O log mostrado no print não inclui o erro detalhado, então não é possível provar qual linha quebrou a compilação. Contudo, o Orquestria usa Next.js 14 configurado com `output: "export"` e publica `frontend/out/` no Netlify. Nesse modo **não existe um servidor Next.js em tempo de execução**. A entrega anterior colocou um endpoint **dinâmico**, `frontend/src/app/api/orquestria-readiness/route.ts`, com `dynamic = "force-dynamic"`, incompatível com o build estático. Essa é a incompatibilidade específica tratada neste patch.

## Solução

1. `frontend/public/_redirects`: proxy reverso específico do Netlify para `/api/orquestria-readiness` -> `https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health`, com `200!` para forçar a regra mesmo existindo arquivo estático na rota. Como a requisição do navegador vai ao **mesmo domínio do Netlify**, não depende de CORS do Blitz.
2. `frontend/src/app/api/orquestria-readiness/route.ts`: vira um *handler estático* de compatibilidade. Seu JSON `{ "status": "unavailable" }` só é gerado no build; em produção o Netlify faz proxy para o health real. **Nunca retornar `UP` nesse arquivo**, pois isso mascararia backend offline caso o proxy não seja aplicado.
3. `frontend/src/components/system/ApiReadinessGate.tsx`: só libera login/Kanban/gerenciamento se o proxy responder **HTTP 200 + JSON + `{"status":"UP"}`**. A página HTML de wake-up, HTML de erro ou `DOWN` mantêm a tela de preparação. A verificação é refeita em intervalos de 5 s e tolera cold starts, 502 e timeout.
4. Mantém `frontend/src/app/template.tsx` e os demais arquivos da etapa 6 **intactos**, inclusive a sidebar com **Gerenciar itens** e a restauração da sessão após a API acordar.

O proxy do Netlify tem limite documentado de 26 segundos por requisição. O frontend aborta cada tentativa após 12 segundos e repete até o health indicar `UP`. Esse comportamento é normal no plano gratuito do Blitz.

## Como validar

1. Aplicar **somente os arquivos do ZIP, preservando os caminhos**. Se já existir `frontend/public/_redirects` com outras regras, juntar a nova regra **no começo** do arquivo, sem apagar regras existentes. Não alterar `netlify.toml`, `next.config` nem o backend.
2. Verificar no Netlify se o `npm run build` passou e publicou a pasta `out/`.
3. Abrir `https://orquestria.netlify.app/api/orquestria-readiness`. Quando o Blitz está acordado, a resposta deve ser um JSON real com `"status":"UP"` (e eventualmente `groups`). **Se mostrar `unavailable`**, a regra proxy não foi aplicada. **Se mostrar HTML**, o Blitz pode ainda estar acordando ou o proxy pode estar retornando erro temporário.
4. Com Blitz em *Sleeping*, abrir o Orquestria em uma janela anônima. Deve aparecer **Preparando seu ambiente** e, após readiness `UP`, a tela de login. Não deve aparecer um erro prematuro de login.
5. Com uma conta já logada, deixar o Blitz dormir, pressionar F5 e confirmar: tela de preparação -> restabelecimento do Kanban com a sessão ainda válida.
6. Repetir o acesso direto a `/gerenciar` com sessão válida. Não deve liberar a tela antes do health `UP`.
7. Confirmar no console o log `[Orquestria][readiness] API Java disponível`, sem registrar token/senha.

## Escopo

Correção exclusiva do frontend e da regra de proxy do Netlify. Sem novas migrações, sem mexer em credenciais, sem modificação do Java. O Blitz continua podendo dormir; a aplicação passa a aguardar e reabrir automaticamente quando acordar. Os testes de exclusão e isolamento da Etapa 6 continuam pendentes.
