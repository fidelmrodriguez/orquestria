# Segurança e operação

Este documento descreve as proteções aplicadas à API Java e ao frontend estático do Orquestria, e como investigar falhas sem registrar dados privados.

## Autenticação e autorização

- Recursos em `/api/**` exigem token Bearer, exceto login e cadastro. A validação da propriedade de projetos, workspaces, colunas e tarefas ocorre na API, não apenas no frontend.
- A sessão tem validade definida pelo backend; o logout invalida o token de sessão correspondente. O frontend preserva a sessão em falhas transitórias de rede e a encerra ao receber HTTP 401.
- O login limita o tamanho dos campos de identificação e senha. Essa validação **não é um mecanismo de limitação de tentativas**: rate limiting na borda ainda requer infraestrutura apropriada para identificar clientes atrás do proxy.
- A conta Guest é compartilhada e serve apenas para demonstração; dados sensíveis não devem ser armazenados nela. A inclusão de um membro permite atribuir-lhe tarefas, mas **não compartilha automaticamente projetos privados**.

## Respostas e diagnóstico

Cada requisição a `/api/**` recebe um cabeçalho `X-Request-ID` gerado pelo servidor. Esse identificador também aparece nos logs do backend (`rid=...`) e permite correlacionar erros sem registrar tokens, senhas, conteúdo de formulários ou parâmetros de URL.

As requisições da API recebem `Cache-Control: no-store, max-age=0` e `Pragma: no-cache` para desencorajar o cache de respostas privadas. Os logs incluem apenas a família de endpoint (ex.: `projects`), método, status e duração. Chamadas de saúde bem-sucedidas não geram logs de acesso adicionais.

Falhas inesperadas retornam HTTP 500 com mensagem genérica e, quando disponível, o identificador da requisição. O backend registra somente o tipo da exceção, sem sua mensagem, porque exceções de banco podem conter dados privados. Erros esperados, como recurso inexistente, conflito ou validação, mantêm seus respectivos códigos HTTP. JSON inválido gera HTTP 400 com texto genérico.

O frontend não exibe conteúdo HTML de erro devolvido pela hospedagem. Quando a API estiver iniciando ou temporariamente indisponível, mostra uma mensagem compreensível ao usuário; erros HTTP 500 não expõem conteúdo de resposta do servidor. A sessão só é descartada ao receber HTTP 401, não em erros de conexão.

## Cabeçalhos do frontend

O Netlify lê `frontend/public/_headers` na exportação estática e aplica `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`. Uma política CSP estrita dependerá da auditoria dos scripts e estilos do Next.js exportado antes de ser habilitada, para evitar bloquear a aplicação. A configuração de headers para rotas proxied pode depender do comportamento do Netlify; valide as respostas publicadas.

## Saúde da API

`GET /actuator/health` permanece público e expõe somente o status, sem detalhes de banco. O frontend usa essa rota (através do proxy do Netlify) para esperar o despertar da API no Blitz. A aplicação no plano gratuito pode dormir por inatividade; os mecanismos de diagnóstico não garantem disponibilidade contínua.

## Validação e operação

1. Conferir os dois jobs do workflow **Orquestria CI** no GitHub Actions.
2. Verificar na aba Network que respostas de `/api/**` incluem `X-Request-ID` e proibição de cache.
3. Enviar JSON inválido a um endpoint público de teste e confirmar HTTP 400, sem exceções internas na resposta.
4. Confirmar que a aplicação mantém a sessão quando o servidor cai temporariamente e consegue recuperar os dados após nova tentativa.
5. Verificar que o health continua indicando `UP` e que a tela de preparação libera o login/Kanban quando o Blitz acorda.

## Limites e pontos futuros

Não há rate limiting distribuído, monitoramento externo de disponibilidade, infraestrutura de logs centralizados, recuperação de senha nem colaboração entre contas com permissões compartilhadas. Esses recursos exigem decisões de infraestrutura e autorização separadas. A autenticação utiliza um token no armazenamento do navegador; por isso, a prevenção de XSS, revisão de dependências e futuras políticas CSP devem continuar sendo tratadas como prioridades de segurança.
