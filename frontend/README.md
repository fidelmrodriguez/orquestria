# Frontend · Orquestria

Interface web do Orquestria, desenvolvida com **Next.js 14 (App Router), React 18, TypeScript e Tailwind CSS**. O frontend reúne a navegação entre workspaces e projetos, a experiência do quadro Kanban e os formulários de tarefas, equipes e tags. Os dados das contas são persistidos pela [API Java](../backend/README.md).

[**Abrir aplicação**](https://orquestria.netlify.app/) · [Visão geral do projeto](../README.md) · [Arquitetura](../docs/ARQUITETURA.md) · [Usabilidade e acessibilidade](../docs/UX_ACESSIBILIDADE.md)

## Interface e experiência

- **Kanban:** criação e edição de colunas e tarefas, reordenação de cartões por drag-and-drop e movimentação entre colunas com persistência da posição no servidor.
- **Detalhes da tarefa:** painel lateral para título, descrição, prioridade, responsável, prazo, tags e comentários; exclusão contextual com confirmação.
- **Navegação responsiva:** múltiplas colunas no desktop; em telas menores que 1024 px, uma coluna por vez, com seletor e botões de navegação. Sidebar recolhível em desktop e menu adaptado para celular.
- **Pesquisa e filtros:** busca por tarefas, prioridade e responsável; o campo de pesquisa se adapta ao tamanho da tela.
- **Formulários e feedback:** validação, indicadores de salvamento, mensagens de erro, estados vazios e controles com suporte a teclado.
- **Conta e personalização:** login pessoal ou Guest, sessão restaurada entre atualizações, tema claro/escuro, gerenciamento de equipe e catálogo de tags com sugestões.

O modo Guest utiliza dados compartilhados com outros visitantes; contas pessoais têm seus recursos isolados pela API. Adicionar um usuário à equipe de um projeto concede acesso somente àquele projeto, com o papel **membro-admin**. O proprietário mantém o papel **admin** e o controle sobre os participantes. Na sidebar, a pessoa encontra os projetos compartilhados em **Workspaces convidados**.

## Tecnologias e responsabilidades

| Tecnologia | Utilização no frontend |
| --- | --- |
| **Next.js 14 + React 18** | App Router, composição de páginas e componentes e exportação estática |
| **TypeScript** | Tipagem de entidades, respostas da API e operações do Kanban |
| **Tailwind CSS** | Estilização, temas claro/escuro e layout responsivo |
| **Zustand** | Estado do quadro, seleção de workspace/projeto, filtros e atualizações da interface |
| **TanStack Query** | Infraestrutura de consultas e cache via `QueryClientProvider` |
| **React Hook Form + Zod** | Formulários e validação de entradas |
| **Jest + React Testing Library** | Testes de componentes, interação e regras da camada de interface |

## Organização do código

```text
frontend/
├── src/
│   ├── app/                       # Páginas e layout do App Router
│   ├── components/
│   │   ├── app/                   # Estrutura principal da aplicação
│   │   ├── auth/                  # Acesso e cadastro
│   │   ├── board/                 # Quadro, colunas, cartões e detalhes
│   │   ├── layout/                # Sidebar, barra superior e pesquisa
│   │   ├── tags/ e team/          # Edição de tags e seleção de membros
│   │   └── tasks/                 # Formulário de novas tarefas
│   ├── hooks/                     # Inicialização, sincronização e foco
│   ├── lib/                       # Cliente HTTP, autenticação e regras auxiliares
│   ├── store/                     # Estado do Kanban com Zustand
│   └── types/                     # Tipos de domínio compartilhados
├── public/                        # Regras de proxy e cabeçalhos do Netlify
├── package.json
└── next.config.mjs
```

A interface utiliza `AppShell` como composição principal. O estado de workspaces, projetos, colunas, tarefas e filtros é organizado em `src/store/board-store.ts`; `src/lib/remote-board.ts` contém o cliente HTTP autenticado e as transformações entre as respostas Java e os modelos visuais. O servidor continua sendo a **fonte de verdade** para os dados persistidos.

## Executar e testar

Pré-requisito: **Node.js 22** (consulte o [`.nvmrc`](../.nvmrc)). Na pasta `frontend/`:

```bash
npm ci
npm run dev
```

A interface de desenvolvimento estará disponível em `http://localhost:3000`. Para integrar com a API Java, configure a variável **pública** no ambiente do frontend (por exemplo, em `frontend/.env.local`):

```dotenv
NEXT_PUBLIC_ORQUESTRIA_API_URL=http://localhost:8080
```

Use essa URL somente se o backend estiver realmente acessível nesse endereço. Sem essa variável, o projeto possui um modo local de demonstração; **ele não representa os dados do PostgreSQL**. Como o valor é incorporado ao JavaScript no build, não coloque senhas, tokens ou segredos em variáveis `NEXT_PUBLIC_`.

Verificações disponíveis:

```bash
npm run typecheck
npm test -- --runInBand --ci
npm run build
```

`npm run build` utiliza `output: "export"` e gera os arquivos estáticos na pasta `out/`. O script `npm run lint` também executa a verificação de tipos; não se trata de uma configuração independente de ESLint.

## Integração e publicação

O frontend é publicado no **Netlify** como site estático. A autenticação e as operações privadas usam HTTPS e tokens Bearer com validação no Spring Boot. O cliente não remove a sessão apenas por indisponibilidade temporária da API.

Quando o serviço Java está suspenso, `ApiReadinessGate` aguarda uma resposta válida de `/api/orquestria-readiness`, encaminhada pelo proxy do Netlify para `/actuator/health`. A tela de preparação evita apresentar login e Kanban antes de o backend responder, mas não mantém o servidor permanentemente ativo.

Para configuração de ambiente e publicação, consulte [Deploy no Netlify](../docs/DEPLOY_NETLIFY.md). O repositório executa TypeScript, Jest e build estático no [GitHub Actions](../docs/TESTES.md); mudanças de UX também devem ser verificadas manualmente em tamanhos diferentes de tela e via teclado.

## Projetos compartilhados

O frontend carrega os projetos próprios e os compartilhados separadamente. **Workspaces convidados** é uma categoria de navegação que contém somente os projetos autorizados; não é uma cópia de todo o workspace do proprietário. Veja [regras de colaboração](../docs/COLABORACAO.md).
