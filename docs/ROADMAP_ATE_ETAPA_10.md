# Orquestria — Grade até a v1.0 de portfólio

Este é o **cronograma proposto a partir de 26/10/2026**, não um plano que já estivesse integralmente definido no repositório original. As estimativas são em sessões de desenvolvimento e validação, não prazos ou datas garantidas.

| Etapa | Foco | Entregáveis / critério de encerramento | Estimativa | Situação |
|---|---|---|---|---|
| 0 | Interface inicial | Base Next.js e layout do Kanban | — | Concluída |
| 1 | API Java | Spring Boot e primeiros endpoints | — | Concluída |
| 2 | Nuvem e banco | Deploy, Flyway, PostgreSQL Neon | — | Concluída |
| 3 | Domínio Kanban | Workspaces, projetos, colunas e tarefas | — | Concluída |
| 4 | Integração | Frontend consumindo API, persistência | — | Concluída |
| 5 | Autenticação | Guest/pessoal, username/e-mail, token, F5 | — | Concluída |
| 6 | CRUD e colaboração básica | Exclusões, segurança, atalhos, equipe e tags | — | Validada pelo usuário |
| 7 | Qualidade e CI | Testes Spring/Jest, PostgreSQL descartável, Flyway e GitHub Actions verdes | 2–3 sessões | Em execução |
| 8 | UX e acessibilidade | Responsividade, teclado, formulários, mensagens de erro, estados de carregamento e usabilidade | 2 sessões | Pendente |
| 9 | Segurança e operação | Revisão de permissões, tratamento de falhas, logs seguros, limites e confiabilidade dos serviços | 2–3 sessões | Pendente |
| 10 | Portfólio e release | README, arquitetura, documentação da API, demonstração, screenshots, roteiro de entrevista e checklist de release | 1–2 sessões | Pendente |

**Total restante estimado:** 7–10 sessões. **Contagem do plano:** a Etapa 0 foi a preparação do frontend; as Etapas 1–10 são as dez etapas numeradas de entrega. **Marco final:** Etapa 10 / Orquestria v1.0 de portfólio. Melhorias posteriores podem virar versões 1.1 ou 2.0, sem bloquear a conclusão da v1.0.

## Critérios por etapa

### Etapa 7
- Testes Java e frontend executados automaticamente em push/PR;
- Fluxos essenciais de autenticação, isolamento e CRUD cobertos com testes de integração;
- Todos os checks verdes no GitHub Actions.

### Etapa 8
- Tarefas principais utilizáveis no desktop e no celular;
- Fluxos navegáveis por teclado, foco visível, modais e labels acessíveis;
- Mensagens claras para erro, ausência de dados, carregamento e indisponibilidade do backend;
- Sem regressões funcionais.

### Etapa 9
- Auditoria de permissão de recursos e sessão;
- Erros e logs sem vazamento de dados sensíveis;
- Resiliência a falhas do Blitz/Neon, comportamento seguro de formulários e operações idempotentes onde apropriado;
- Ambiente de produção estável, sem expor dados pessoais ou credenciais.

### Etapa 10
- README com visão geral, tecnologias, decisões de arquitetura, comandos e links de demonstração;
- Diagrama simplificado (Next.js/Netlify → Spring/Blitz → PostgreSQL/Neon);
- Guia de APIs, capturas das telas, vídeo curto e checklist de validação;
- Release `v1.0.0` identificável no GitHub.

## Limites do escopo

O Orquestria da v1.0 mantém o isolamento por conta implementado na Etapa 5/6: **ser membro da equipe não significa ter acesso automático aos projetos privados do dono**. Compartilhamento real de projetos, convite por e-mail, papéis e permissões colaborativas exigiriam uma etapa adicional específica e não são pressupostos aqui.
