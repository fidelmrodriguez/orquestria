# Orquestria — Espera automática pelo despertar da API Blitz

## Por que esta correção existe

O ambiente gratuito no Blitz dorme após um período de inatividade. A primeira requisição pode mostrar uma página de despertar ou falhar enquanto Java 21, Spring Boot, Flyway e Neon iniciam. Um recrutador não deve encontrar uma tela de login que falha por esse motivo, e um usuário já autenticado não deve perder a sessão durante esse despertar.

## Fluxo de inicialização

1. `frontend/src/app/template.tsx` envolve **todas as rotas da aplicação** com `ApiReadinessGate` antes de renderizar o login, cadastro, Kanban e `/gerenciar`.
2. O browser consulta `GET /api/orquestria-readiness` no próprio domínio Netlify. O endpoint Next.js executa a verificação anônima do backend **no servidor**, sem depender de CORS entre Netlify e Blitz.
3. A verificação consulta `GET /actuator/health` no Blitz e exige JSON com `status: "UP"`. Uma página HTML do Blitz informando que o aplicativo está acordando, mesmo que venha com HTTP 200, não libera a interface.
4. Se o health estiver protegido ou indisponível por política de acesso (`401`, `403`, `404` ou `405`), usa como alternativa uma chamada **sem credenciais** a `GET /api/auth/me`. Um `401/403` desse endpoint de autenticação indica que o Spring está respondendo; não revela nem usa a sessão do visitante.
5. Se o backend não estiver pronto, a tela informa “Preparando seu ambiente” e repete o teste aproximadamente a cada cinco segundos, sem cliques em Wake e sem múltiplas chamadas simultâneas.
6. Quando houver resposta de prontidão, o gate renderiza a aplicação normal. **Sessão inexistente:** mostra o login. **Sessão existente:** o fluxo atual restaura o token e o usuário com `/api/auth/me`, sem limpar a sessão por falha transitória do Blitz.

## Segurança e observabilidade

- A verificação de prontidão **não recebe token**, e-mail nem senha do navegador.
- O endpoint próprio nunca expõe a resposta completa do Blitz ao usuário, apenas `ready` ou `waking`.
- A resposta utiliza `Cache-Control: no-store` para não reutilizar um diagnóstico de prontidão antigo. A rota de sondagem retorna HTTP `200` com `status: waking` mesmo durante o cold start, evitando poluir o console com falsos erros `503`; o gate se baseia no campo `status`, nunca apenas no HTTP 200.
- A implementação não cria chamadas destrutivas, não altera o Java, Flyway, PostgreSQL, regras da Etapa 6 ou credenciais existentes.
- A UI não libera ações enquanto a API ainda está acordando. Isso é uma barreira de UX; autorização de verdade continua no Spring Security.
- O fallback `401/403` confirma que a API Java respondeu, mas não substitui um health profundo de banco de dados. Quando `/actuator/health` está acessível, `UP` é o sinal preferido.

## Atenção ao deploy

Esta implementação precisa de suporte a **Next.js Route Handlers** no Netlify (`src/app/api/orquestria-readiness/route.ts`). Não funciona como exportação totalmente estática (`output: 'export'`). O Netlify deve publicar a função/rota do Next normalmente. Em caso de 404 nessa rota interna, o gate não libera a tela e é preciso corrigir o deploy do Next, sem alterar o Blitz.

A URL do backend vem de `ORQUESTRIA_API_URL` (se definida) ou `NEXT_PUBLIC_ORQUESTRIA_API_URL` e, como fallback exclusivo deste projeto, de `https://orquestria-api.fidelmrodriguez.blitz.cloud`.

## Testes após publicar no Netlify

1. Deixar o Blitz em `Sleeping`, abrir `https://orquestria.netlify.app/` em navegação anônima. Deve aparecer **Preparando seu ambiente**, e não o formulário de login.
2. Observar em **Network** requisições para `/api/orquestria-readiness`: respostas HTTP `200` com JSON `status: waking` durante o despertar e `status: ready` depois da inicialização. O browser não deve ser redirecionado à página “waking up” do Blitz.
3. Sem clicar em Wake no painel do Blitz, conferir que o login aparece automaticamente quando a API está operacional; entrar com guest e com uma conta pessoal.
4. Já autenticado, usar F5 depois de a API dormir: a tela de preparação deverá reaparecer enquanto o Blitz acorda e o Kanban deverá retornar com a sessão restaurada.
5. Abrir `/gerenciar` em nova aba com sessão existente. Verificar que só aparece após a API ficar pronta e que os dados continuam restritos à conta autenticada.
6. Em caso de indisponibilidade prolongada, conferir a mensagem de espera ampliada após aproximadamente um minuto, o botão **Verificar agora** e as tentativas automáticas. A tela de login não deve aparecer antes da disponibilidade da API.
7. Testar que, depois do logout, o app retorna ao login normal; a verificação de prontidão não deve autenticar o visitante nem substituir o token.

## Limitação operacional

O cold start do plano gratuito continua existindo e a primeira visita poderá levar algum tempo. Esta melhoria automatiza a verificação e oferece um estado de espera profissional; **não mantém o servidor permanentemente online**, nem garante disponibilidade quando a infraestrutura do Blitz falhar por outros motivos.

Depois destes testes, retomar a validação final da **Etapa 6**: exclusão de colunas, isolamento entre contas e confirmação de que as ações excluídas não reaparecem após F5.
