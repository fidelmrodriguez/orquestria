# Documentação técnica

Esta documentação descreve a arquitetura, os contratos da API, a infraestrutura e os critérios de qualidade do Orquestria. O [README principal](../README.md) oferece uma visão geral do produto; os READMEs de [frontend](../frontend/README.md) e [backend](../backend/README.md) descrevem cada aplicação.

| Documento | Conteúdo |
| --- | --- |
| [Frontend — Next.js e React](../frontend/README.md) | Componentes, estado, UX, testes e execução da interface |
| [Backend — Spring Boot](../backend/README.md) | Regras da API, PostgreSQL, migrações e execução |
| [Arquitetura](ARQUITETURA.md) | Componentes, fluxo de dados, persistência, sessão e decisões técnicas |
| [API REST](API.md) | Rotas, autenticação, regras de integridade e respostas HTTP |
| [Exemplos da API](API_EXEMPLOS.md) | Requisições Bash/curl com autenticação e criação de recursos |
| [Decisões técnicas](DECISOES_TECNICAS.md) | Justificativas e compromissos das escolhas arquiteturais |
| [Testes e CI](TESTES.md) | Estratégia de testes, GitHub Actions e banco PostgreSQL temporário |
| [Deploy da API e banco](DEPLOY_CLOUD.md) | Hospedagem no Blitz, PostgreSQL no Neon e variáveis de ambiente |
| [Deploy do frontend](DEPLOY_NETLIFY.md) | Next.js estático no Netlify e proxy de prontidão |
| [Segurança e operação](SEGURANCA_OPERACAO.md) | Autorização, respostas seguras, diagnóstico e observabilidade |
| [Retenção e manutenção do banco](RETENCAO_DADOS.md) | Políticas de limpeza, agendamento e proteções para contas |
| [UX e acessibilidade](UX_ACESSIBILIDADE.md) | Interações por teclado, drawers, mobile e navegação responsiva |
| [Publicação da versão 1.0.0](RELEASE.md) | Checklist de aceite, tag, publicação e recuperação |
| [Histórico de versões](../CHANGELOG.md) | Mudanças relevantes do produto por versão |
| [Roadmap](ROADMAP.md) | Melhorias planejadas e critérios de conclusão |

## Organização

A documentação é organizada por **assunto** para que as informações permaneçam úteis independentemente de quando determinada funcionalidade foi adicionada. O histórico de alterações e implementações permanece disponível nos commits do Git.

Quando houver divergência entre um texto e o comportamento efetivo do sistema, os contratos implementados no código e os testes automatizados são a referência para a correção da documentação.
