# Documentação do Orquestria

O [README principal](../README.md) apresenta a aplicação e mostra como acessá-la. Aqui ficam as decisões de implementação e os testes de cada fase, para quem quiser conhecer a evolução do projeto.

## Evolução

| Fase | Entrega | Documento |
| --- | --- | --- |
| 0 | Frontend Next.js, Kanban demonstrativo e publicação no Netlify | [Frontend inicial](ETAPA_0_FRONTEND.md) |
| 1 | Primeira API Spring Boot, projetos, JPA e migração V1 | [API Java inicial](ETAPA_1_API_JAVA.md) |
| 2 | Hospedagem da API, conexão com Neon e testes do navegador | [Integração na nuvem](ETAPA_2_DEPLOY_NUVEM.md) |
| 3 | Workspaces, colunas, tarefas e migração V2 | [Kanban na API](ETAPA_3_KANBAN_API.md) |
| 4 | Kanban principal conectado ao backend, edições, comentários e migração V3 | [Integração do Kanban](ETAPA_4_INTEGRACAO.md) |

Esses documentos registram o escopo de cada entrega. Para consultar **o que está disponível hoje**, comece pelo [README principal](../README.md), pois algumas fases descrevem versões anteriores do projeto.

## Publicação

- [Frontend no Netlify](DEPLOY_NETLIFY.md)
- [API no Blitz e PostgreSQL no Neon](DEPLOY_CLOUD.md)

## O que ainda falta

A API segue sem autenticação e autorização por usuário. O ambiente é público e deve usar apenas dados fictícios. A manutenção automática de dados foi adiada para uma entrega futura, em commit próprio; **não há exclusão agendada**.
