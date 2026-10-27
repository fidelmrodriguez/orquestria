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
- Rotina de manutenção agendada para dados antigos do Guest e sessões expiradas, com política de retenção protegida para contas pessoais (veja [Retenção de dados](RETENCAO_DADOS.md)).

## Critérios de publicação da versão 1.0.0

A base funcional, os ajustes de usabilidade/acessibilidade, o tratamento de erros e as rotinas de CI já fazem parte do código. A conclusão da versão estável depende da **aprovação do CI no commit da versão, da validação no ambiente publicado e da criação da tag `v1.0.0`**, conforme o [guia de publicação](RELEASE.md).

## Melhorias contínuas

| Área | Evolução planejada | Critério de conclusão |
| --- | --- | --- |
| **Qualidade e CI** | Consolidar testes de integração, frontend e build automatizado | Jobs de backend e frontend aprovados no GitHub Actions |
| **Usabilidade** | Revisar formulários, mensagens de erro, navegação mobile e estados vazios | Fluxos principais utilizáveis em diferentes tamanhos de tela, sem regressões |
| **Acessibilidade** | Refinar rótulos, foco, teclado e interação com diálogos | Navegação essencial possível por teclado e controles adequadamente identificados |
| **Segurança e operação** | Reavaliar autorização, tratamento de falhas, logs e limites de entrada | Testes de autorização e comportamento consistente sob falhas transitórias |
| **Documentação** | Manter contratos, exemplos, decisões técnicas e changelog alinhados ao código | Links locais válidos, exemplos revisados e mudanças descritas |

## Fora do escopo atual

- Compartilhamento de projetos entre contas com papéis, convites e permissões por membro.
- Recuperação de senha e exclusão de contas por solicitação do próprio usuário.
- Notificações em tempo real e colaboração simultânea.

Ser membro da equipe permite ser escolhido como responsável por tarefas, mas **não concede acesso aos projetos de outra conta**. Colaboração com permissões compartilhadas exige modelagem e autorização adicionais.
