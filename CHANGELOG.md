# Histórico de versões

Este arquivo registra mudanças relevantes do produto por versão. O histórico granular de commits permanece no Git.

## [Unreleased]

### Melhorias de usabilidade e desempenho

- Tela **Preparando seu ambiente** compactada no celular, mantendo tempo e acompanhamento automático da API.
- Menu mobile mostra o nome da conta atual, fecha no logout/troca de conta e usa espaçamento inferior pequeno, sem cortar o botão **Sair**.
- Login e cadastro apresentados primeiro no mobile, mantendo a composição institucional do desktop.
- Correção de quebra de nomes muito longos em Gerenciar itens, sem expandir horizontalmente os cartões.
- Área rolável de segurança após o botão Sair no menu mobile e espaçamento para as setas dos filtros.

- Menu mobile com rolagem até o último item, respeitando áreas seguras e escondendo apenas o trilho de rolagem.
- Formulário Nova coluna integrado ao seletor no mobile, sem cortes laterais ao abrir o teclado.
- Menu de movimentação de tarefas acima de outros cards por portal e linha de inserção do drag-and-drop mais discreta.
- Central de notificações local: operações confirmadas, lembretes de vencimento, controle de leitura e abertura contextual de tarefas; sem push externo.

- Criação de tarefa contextual em cada coluna e ação de nova coluna acima do Kanban.
- Ajustes de altura, navegação horizontal no rodapé do quadro e rolagem interna da sidebar quando necessária.
- Exclusão individual de comentários com confirmação e isolamento por projeto.
- Redução de recargas completas após exclusões e mutações de tarefas, comentários, colunas e nomes de projetos.
- Listagem de tarefas com carregamento conjunto de comentários para reduzir consultas ao PostgreSQL.


### Preparação da versão 1.0.0

- Organização de workspaces e projetos em quadros Kanban com colunas e tarefas personalizáveis.
- Cadastro de contas pessoais, login por nome de usuário ou e-mail e sessão persistente.
- Separação de dados por conta e conta guest compartilhada para demonstração.
- Detalhes de tarefas: responsáveis, prioridade, prazo, tags, comentários e movimentação entre colunas.
- Diretório de usuários e seleção de membros da equipe para atribuição de tarefas.
- Catálogo de tags por conta, com sugestões, renomeação e remoção.
- Exclusões com confirmação e validações de integridade de colunas e workspaces.
- Ajustes de acessibilidade para navegação por teclado, diálogos e menu responsivo.
- Verificação de prontidão da API durante a inicialização da hospedagem.
- Identificadores de requisição, mensagens de erro controladas e cabeçalhos de proteção de cache.
- Testes de integração Java/PostgreSQL, testes Jest e workflow de CI.
- Documentação da API, arquitetura, decisões técnicas e processo de publicação.

A seção permanece **Unreleased** até a execução do checklist em [Publicação da versão 1.0.0](docs/RELEASE.md) e a criação da tag `v1.0.0`.
