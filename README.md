# Orquestria

**Gestão de projetos e tarefas com Kanban, colaboração e uma interface pensada para o trabalho em equipe.**

> **Status do projeto:** frontend funcional · backend Java/Spring Boot planejado.
>
> **Demonstração:** endereço Netlify a adicionar após a publicação deste repositório.

O **Orquestria** é uma aplicação para organizar projetos e tarefas em equipe. Nesta primeira versão, desenvolvi o frontend com **Next.js, React e TypeScript**, incluindo workspaces, gerenciamento de tarefas e quadro Kanban. O próximo passo é criar uma API com **Java e Spring Boot**, usando **PostgreSQL** para armazenar os dados no servidor.

## Visão rápida

| | Estado atual |
| --- | --- |
| **Frontend** | ✅ Implementado, pronto para execução local e deploy |
| **Backend Java** | 🗓️ Planejado — não implementado nesta versão |
| **Banco de dados** | 🗓️ PostgreSQL planejado — ainda sem persistência no servidor |
| **Dados da demonstração** | DummyJSON na carga inicial; alterações mantidas no navegador (`localStorage`) |
| **Testes** | Testes unitários com Jest e React Testing Library |
| **Deploy** | Next.js via Netlify; URL pública adicionada após a publicação |

## Funcionalidades disponíveis

- **Gestão de workspaces e projetos:** criação e navegação por áreas e projetos.
- **Quadro Kanban:** colunas editáveis, criação e movimentação de tarefas com drag and drop nativo.
- **Gestão de tarefas:** edição de título, descrição, prioridade, responsáveis, tags e prazo, além de comentários.
- **Organização do trabalho:** pesquisa e filtros por prioridade e responsável.
- **Experiência de uso:** layout responsivo, navegação mobile, tema claro/escuro, notificações e painéis laterais.
- **Estado da aplicação:** Zustand com persistência local e sincronização **entre abas do mesmo navegador** via `BroadcastChannel`.
- **Qualidade:** formulários com React Hook Form + Zod e testes automatizados com Jest / React Testing Library.

> **Demonstração, não autenticação de produção:** a tela de login valida campos no frontend e cria uma sessão local. A senha não é autenticada por um servidor. Os dados editados não ficam compartilhados entre usuários/dispositivos. Os links de compartilhamento exibidos pela interface ainda não concedem acesso real a outras pessoas.

## Stack e arquitetura

**Frontend implementado:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query, React Hook Form, Zod, Jest e React Testing Library.

**Backend planejado:** Java, Spring Boot, Spring Data JPA/Hibernate, PostgreSQL, Spring Security, testes e documentação de API. Essas tecnologias **ainda não fazem parte do código entregue**.

### Arquitetura atual

```text
                ┌───────────────────────────────┐
                │ Frontend · Next.js / React    │
                │ hospedagem: Netlify           │
                └───────────────┬───────────────┘
                                │
                 ┌──────────────┴───────────────┐
                 ▼                              ▼
      DummyJSON (dados iniciais)     Zustand + localStorage
                                    BroadcastChannel (abas)
```

### Evolução planejada

```text
    Next.js / React (Netlify)
              │
              │ HTTP / JSON
              ▼
    API REST · Java / Spring Boot
              │
              │ JPA / Hibernate
              ▼
           PostgreSQL
```

A proposta é substituir progressivamente os dados demonstrativos e a persistência local por operações de API, persistência relacional e regras de autorização no servidor. O backend terá **deploy independente** do frontend.

## Estrutura do repositório

```text
orquestria/
├── frontend/                # Aplicação Next.js funcional
│   ├── src/app/             # App Router, layout e estilos globais
│   ├── src/components/      # Interface e componentes por domínio
│   ├── src/hooks/           # Hooks de carga inicial e sincronização
│   ├── src/lib/             # Fonte de dados e regras auxiliares
│   ├── src/store/           # Estado e persistência local com Zustand
│   ├── src/types/           # Modelos TypeScript
│   ├── package.json
│   └── package-lock.json
├── backend/                 # Reservado para a futura API Spring Boot
├── docs/
│   └── DEPLOY_NETLIFY.md   # Publicação do frontend
├── netlify.toml             # Build do frontend a partir da subpasta
└── README.md
```

## Rodando localmente

**Pré-requisitos:** Node.js 20+ e npm.

```bash
git clone https://github.com/fidelmrodriguez/orquestria.git
cd orquestria/frontend
npm ci
npm run dev
```

Acesse **http://localhost:3000**.

> Se você escolher outro nome para o repositório no GitHub, ajuste a URL do `git clone` acima.

Para experimentar, use os dados demonstrativos que já vêm preenchidos na tela de entrada (nome, e-mail e senha). Nenhum cadastro real é necessário nesta versão.

**Scripts disponíveis** (executados dentro de `frontend/`):

```bash
npm run dev        # ambiente de desenvolvimento
npm run build      # build de produção
npm start          # inicia o build de produção
npm test           # testes unitários
npm run typecheck  # verificação de tipos TypeScript
```

A carga inicial de usuários e tarefas depende da disponibilidade da API pública **DummyJSON**. Depois da carga, as alterações são mantidas no armazenamento local do navegador. Para reiniciar a demonstração, limpe a chave `orquestria-storage-v1` do `localStorage`.

## Deploy do frontend

Este repositório foi organizado para publicar **somente `frontend/` no Netlify**, mesmo com a estrutura reservada para um backend futuro. O arquivo `netlify.toml` na raiz configura o build a partir da subpasta `frontend`.

Veja o procedimento em [docs/DEPLOY_NETLIFY.md](docs/DEPLOY_NETLIFY.md). Quando o deploy estiver publicado, substitua a linha **Demonstração** no início deste documento pelo link real.

**Nota:** o Netlify não vai iniciar automaticamente um processo Java/Spring Boot contínuo. Quando a API estiver pronta, o frontend consumirá o endereço HTTPS da API hospedada separadamente.

## Próximas etapas — backend Java

A ordem prevista de evolução é:

1. **API REST:** estrutura Spring Boot com controllers, services, DTOs, validações e tratamento centralizado de erros.
2. **Persistência:** modelagem relacional de usuários, workspaces, projetos, colunas, tarefas e comentários no PostgreSQL, utilizando Spring Data JPA/Hibernate e migrações.
3. **Segurança:** autenticação real com Spring Security e autorização por usuário, workspace e projeto.
4. **Integração:** substituir a fonte demonstrativa e a gravação exclusiva no navegador por chamadas à API.
5. **Confiabilidade:** testes unitários e de integração, OpenAPI/Swagger, Docker, CI e deploy da API.

Essas são **etapas planejadas**, não funcionalidades já entregues.

---

**Desenvolvido por [Fidel M Rodriguez](https://github.com/fidelmrodriguez)** · [LinkedIn](https://www.linkedin.com/in/fidelmrodriguez/)
