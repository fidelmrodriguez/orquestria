# Decisões técnicas

O Orquestria mantém frontend, API e persistência em serviços separados. As decisões abaixo registram os compromissos adotados e as limitações correspondentes; não substituem o código nem os testes.

## Frontend estático com Next.js

**Decisão:** utilizar Next.js 14 com `output: "export"` e publicar os arquivos gerados pelo Netlify.

**Motivo:** a interface não depende de um servidor Next.js persistente e consome uma API Java independente. Isso permite publicar a camada visual sem reiniciar o backend.

**Consequências:** rotas dinâmicas de servidor Next.js não podem ser usadas como endpoints operacionais nessa publicação. A rota `/api/orquestria-readiness` é encaminhada para o Spring Boot por uma regra de proxy do Netlify em `frontend/public/_redirects`.

## Spring Boot como limite de autorização

**Decisão:** autenticação e autorização acontecem na API; os filtros visuais da interface não determinam acesso a dados.

**Motivo:** cada workspace, projeto, coluna e tarefa pertence a uma conta. A API valida a titularidade dos recursos durante consultas e alterações.

**Consequências:** o token Bearer é usado em requisições privadas e as verificações de acesso precisam ser cobertas por testes entre contas. A associação de uma pessoa a um projeto específico dá acesso somente àquele projeto, sem expor os outros dados do proprietário.

## Sessão persistida no navegador

**Decisão:** a API emite tokens de sessão aleatórios, armazena seu hash no banco e o frontend mantém o token em `localStorage`.

**Motivo:** persistir a sessão após recarregar a página sem exigir execução do Next.js no servidor.

**Consequências:** a segurança do frontend contra XSS é importante; o logout revoga a sessão no backend; indisponibilidades temporárias não devem ser tratadas automaticamente como HTTP 401.

## Esquema evolutivo com Flyway

**Decisão:** versionar o esquema PostgreSQL em migrações imutáveis (`V1` a `V10` no estado atual).

**Motivo:** reproduzir o ambiente de desenvolvimento e os bancos usados em testes de integração.

**Consequências:** migrações aplicadas não devem ser editadas ou removidas. Alterações posteriores devem criar uma nova versão; rollback de código não equivale a rollback do banco.

## Ações por POST e integridade no backend

**Decisão:** além dos métodos HTTP convencionais, algumas operações de alteração e exclusão possuem rotas explícitas `POST` (`/rename`, `/edit`, `/delete`, `/move`).

**Motivo:** manter compatibilidade com restrições de preflight CORS observadas na hospedagem.

**Consequências:** cada rota mantém as mesmas verificações de autorização e integridade no serviço Java. Uma coluna ocupada não é excluída silenciosamente; projetos removidos excluem suas dependências em transação.

## Demonstração e equipe

**Decisão:** disponibilizar uma conta guest de dados compartilhados e contas pessoais com dados isolados. A equipe define quem pode ser atribuído como responsável às tarefas.

**Motivo:** permitir conhecer o fluxo do produto sem tornar dados privados acessíveis a visitantes.

**Consequências:** não armazenar informações sensíveis na conta guest. O compartilhamento é explícito por projeto: a pessoa adicionada atua como membro-admin e não pode gerenciar participantes. Convites por e-mail não fazem parte deste fluxo.

## Disponibilidade da API na hospedagem

**Decisão:** verificar o health do Spring Boot antes de disponibilizar a interface ao visitante.

**Motivo:** o processo Java pode ser suspenso por inatividade no ambiente atual de publicação.

**Consequências:** a interface exibe uma tela com contador durante a inicialização e só prossegue após resposta válida `status: "UP"`. Isso melhora a experiência, mas não elimina a suspensão do serviço nem garante um tempo de resposta constante.

Mais detalhes em [Arquitetura](ARQUITETURA.md), [Segurança e operação](SEGURANCA_OPERACAO.md) e [Deploy](DEPLOY_CLOUD.md).
