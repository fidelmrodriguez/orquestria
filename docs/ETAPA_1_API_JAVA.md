# Etapa 1 — Primeira API Java

A primeira entrega de backend acrescentou uma API REST em Java 21 e Spring Boot ao repositório, sem alterar o comportamento do frontend que já estava publicado.

## Escopo da entrega

- Projeto Maven com Spring Web, Spring Data JPA/Hibernate, Bean Validation e Actuator.
- Entidade `Project`, serviço de aplicação, repositório JPA, controller e DTOs.
- Primeiros endpoints para cadastrar e consultar projetos.
- Conexão JDBC com PostgreSQL; uso de variáveis de ambiente para as credenciais.
- Migração `V1__create_projects.sql` com Flyway e testes unitários iniciais.

### Endpoints da primeira versão

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/actuator/health` | Conferir o estado da API |
| `GET` | `/api/projects` | Listar projetos |
| `GET` | `/api/projects/{id}` | Consultar um projeto |
| `POST` | `/api/projects` | Criar um projeto |

Exemplo de corpo da criação:

```json
{"name":"Projeto de teste","description":"Primeiro registro persistido"}
```

## Decisões técnicas

**Separação entre frontend e backend.** A API ficou em `backend/`, com build e hospedagem independentes. Isso permite evoluir o servidor sem transformar o projeto Next.js em uma aplicação Java de renderização de telas.

**Persistência com JPA e Flyway.** O JPA é usado no mapeamento e nas operações com entidades; o Flyway mantém as alterações de esquema versionadas. Migrações já executadas não devem ser reescritas.

**Credenciais fora do repositório.** Senhas de banco são variáveis privadas da hospedagem, não parte do código ou do arquivo de build.

## Como foi validado

A primeira API foi publicada na nuvem na etapa seguinte. O endpoint de saúde retornou `UP`; foi possível criar um projeto pela interface de diagnóstico e recuperá-lo novamente do PostgreSQL.

Este documento descreve **a primeira versão da API**. As rotas de workspaces, Kanban e comentários foram adicionadas depois; consulte as [Etapas 3](ETAPA_3_KANBAN_API.md) e [4](ETAPA_4_INTEGRACAO.md).
