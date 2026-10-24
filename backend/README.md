# Backend do Orquestria

API REST em **Java 21 + Spring Boot 3.5**, com PostgreSQL, Spring Data JPA e migrações Flyway. Esta é a primeira etapa do backend: a API de projetos funciona de forma independente; o frontend publicado ainda usa dados demonstrativos e **não consome esses endpoints**.

## Rodar localmente

Você precisa de **Java 21**, **Maven 3.9+** e **Docker com Docker Compose** (ou PostgreSQL 16 instalado).

No terminal, a partir da pasta `backend/`:

```bash
docker compose up -d
mvn spring-boot:run
```

O Compose cria um PostgreSQL local em `localhost:5432` com credenciais **somente para desenvolvimento**. O Spring Boot conecta nesse banco, executa a migração SQL `V1__create_projects.sql` e valida o esquema JPA.

Para rodar os testes unitários:

```bash
mvn test
```

Para usar outro banco, defina `DB_URL` (URL JDBC), `DB_USER` e `DB_PASSWORD` como variáveis de ambiente. O arquivo `.env.example` é referência; não é carregado automaticamente pelo Spring Boot.

## Endpoints disponíveis

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/actuator/health` | Estado da aplicação e das dependências |
| `POST` | `/api/projects` | Cria um projeto |
| `GET` | `/api/projects` | Lista projetos, mais recentes primeiro |
| `GET` | `/api/projects/{id}` | Consulta por identificador UUID |

Criar um projeto:

```bash
curl -i -X POST http://localhost:8080/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"name":"Portal interno","description":"Primeira API do Orquestria"}'
```

Listar projetos:

```bash
curl http://localhost:8080/api/projects
```

A criação retorna **201 Created** com o identificador e o horário de criação. O nome é obrigatório (até 120 caracteres). A descrição é opcional (até 2.000 caracteres). Erros de validação retornam **400** e buscas inexistentes retornam **404**.

## Organização do código

```text
src/main/java/com/orquestria/api/
├── OrquestriaApplication.java
├── common/ApiExceptionHandler.java
└── project/
    ├── Project.java
    ├── ProjectRepository.java
    ├── ProjectService.java
    ├── ProjectController.java
    ├── CreateProjectRequest.java
    ├── ProjectResponse.java
    └── ProjectNotFoundException.java
src/main/resources/
├── application.yml
└── db/migration/V1__create_projects.sql
src/test/java/com/orquestria/api/project/
└── ProjectServiceTest.java
```

## Próximos passos

- Modelar workspaces, colunas e tarefas, com relacionamentos e regras de negócio.
- Adicionar autenticação e autorização com Spring Security.
- Implementar testes de integração com PostgreSQL e documentação OpenAPI.
- Integrar gradualmente a API ao Next.js, retirando a dependência do `localStorage` para os dados de negócio.
- Definir CORS, variáveis de produção e hospedagem HTTPS antes de expor endpoints publicamente.

**Atenção:** esta API inicial ainda não tem autenticação nem rate limiting; use-a **localmente** até a etapa de segurança. As credenciais do Compose são apenas para desenvolvimento.

## Deploy em nuvem (sem IDE)

Veja [docs/DEPLOY_CLOUD.md](../docs/DEPLOY_CLOUD.md). O build Docker executa os testes, o Render hospeda a API e o Neon fornece PostgreSQL via conexão JDBC TLS. As credenciais devem ser configuradas como variáveis privadas no Render.
