# Roadmap do Orquestria

O roadmap reúne melhorias planejadas para a evolução do produto. O escopo e a prioridade podem mudar conforme as necessidades identificadas durante o desenvolvimento e a validação das funcionalidades.

## Base implementada

- Aplicação Next.js integrada à API Java e ao PostgreSQL.
- Workspaces, projetos, Kanban, tarefas, comentários, prazos e prioridades.
- Contas individuais, sessão autenticada e isolamento de dados.
- Exclusões com confirmação e regras de integridade.
- Cadastro de membros da equipe e atribuição de responsáveis.
- Catálogo de tags, autocomplete e edição no quadro.
- Estrutura de testes automatizados e workflow de CI.

## Próximas melhorias

| Área | Evolução planejada | Critério de conclusão |
| --- | --- | --- |
| **Qualidade e CI** | Consolidar testes de integração, frontend e build automatizado | Jobs de backend e frontend aprovados no GitHub Actions |
| **Usabilidade** | Revisar formulários, mensagens de erro, navegação mobile e estados vazios | Fluxos principais utilizáveis em diferentes tamanhos de tela, sem regressões |
| **Acessibilidade** | Refinar rótulos, foco, teclado e interação com diálogos | Navegação essencial possível por teclado e controles adequadamente identificados |
| **Segurança e operação** | Reavaliar autorização, tratamento de falhas, logs e limites de entrada | Testes de autorização e comportamento consistente sob falhas transitórias |
| **Documentação e versão estável** | Consolidar referência de API, arquitetura, exemplos e validação de release | Documentação alinhada ao código, pipeline aprovado e versão marcada no Git |

## Fora do escopo atual

- Compartilhamento de projetos entre contas com papéis e convites.
- Recuperação de senha e exclusão de contas.
- Notificações em tempo real e colaboração simultânea.
- Políticas automáticas de retenção ou limpeza de dados.

Ser membro da equipe permite ser escolhido como responsável por tarefas, mas **não concede acesso aos projetos de outra conta**. Colaboração com permissões compartilhadas exige modelagem e autorização adicionais.
