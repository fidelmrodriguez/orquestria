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

## Ajuste de experiência — aviso fixo de duração do wake-up

Foi observado um despertar do Blitz aproximadamente entre **13h41 e 13h44**, isto é, **3 minutos**. A duração é uma referência observada, não uma garantia de tempo de inicialização em acessos futuros.

- Removido o botão manual **Verificar agora**.
- Removido o aviso condicional de que a inicialização "está levando mais tempo que o habitual".
- Exibido desde o começo um **único aviso fixo** de que o primeiro acesso, quando a API está adormecida, pode levar cerca de 3 minutos.
- Mantida a verificação automática a cada 5 segundos entre tentativas (com timeout de 12 segundos por requisição) e a detecção de `HTTP 200 + JSON + status UP`.
- Login, cadastro, Kanban e `/gerenciar` continuam bloqueados até a API estar pronta; o token existente não é removido durante o despertar e a sessão pode ser restaurada normalmente em seguida.

### Testes desta revisão

1. Com a API dormindo, abrir o site: a tela mostra **Preparando seu ambiente** e o disclaimer de ~3 minutos desde o primeiro instante, sem botão de verificação.
2. Esperar o despertar: a página libera automaticamente a aplicação quando `status: UP` é recebido.
3. Repetir com usuário previamente autenticado: a aplicação deve restaurar a sessão após o wake-up.
4. Confirmar que não aparecem o aviso dinâmico de demora nem o botão **Verificar agora**.

Esta revisão modifica apenas `ApiReadinessGate.tsx` e a documentação. Não altera proxy, rotas, backend, banco nem configuração de deploy.


## Ajuste de experiência — contador de tempo decorrido no despertar

- A tela **Preparando seu ambiente** exibe um contador `MM:SS` logo abaixo de **Aguardando o servidor ficar disponível**.
- Começa em `00:00` ao montar a tela e aumenta a cada segundo enquanto a API não estiver pronta. É **tempo decorrido**, não previsão ou contagem regressiva.
- O contador considera o relógio ao recalcular o tempo, evitando atrasos caso a aba fique em segundo plano. Não altera o intervalo de checagem da API (5 segundos) nem o timeout (12 segundos).
- Mantido o aviso fixo de que o primeiro acesso pode levar **aproximadamente 3 minutos**, sem botão manual nem alerta dinâmico de demora.
- Quando a API responde `HTTP 200 + JSON + status UP`, a tela desaparece automaticamente e o login ou a sessão anterior são restaurados como antes.

### Teste rápido

1. Abra o Orquestria quando o Blitz estiver em modo Sleeping: o contador deve aparecer em `00:00`.
2. Observe `00:01`, `00:02` e a passagem de `00:59` para `01:00` (caso a inicialização dure esse tempo).
3. Confirme que não há botão de verificação e que o aviso fixo de 3 minutos permanece.
4. Assim que o backend estiver pronto, a tela deve desaparecer sem ação manual, tanto para um visitante quanto para uma sessão já autenticada.

A mudança limita-se ao componente visual e à documentação, sem alteração de Java, Netlify, proxy ou banco.
