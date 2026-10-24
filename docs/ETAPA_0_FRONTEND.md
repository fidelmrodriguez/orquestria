# Etapa 0 — Frontend do Orquestria

O projeto começou como uma aplicação de gestão de projetos e tarefas construída com Next.js, React e TypeScript. A primeira entrega tinha foco na experiência de uso: workspaces, projetos, quadro Kanban, detalhes de tarefas e navegação responsiva.

## O que foi entregue

- Interface com quadro Kanban, criação e movimentação de tarefas.
- Formulários, filtros, comentários, temas claro/escuro e navegação mobile.
- Estado de interface com Zustand; carga de dados de demonstração usando DummyJSON.
- Persistência **local no navegador**, antes da existência do backend Java.
- Testes de frontend com Jest e React Testing Library.
- Repositório organizado em `frontend/` e `backend/`, com a API inicialmente reservada para uma etapa seguinte.

O frontend passou a ser publicado no [Netlify](https://orquestria.netlify.app/). Como se trata de um site Next.js exportado estaticamente, o Netlify hospeda a interface, não o processo Java.

## Limites da primeira versão

O login era demonstrativo; não havia contas reais, autorização no servidor nem persistência compartilhada em banco de dados. Os dados do Kanban podiam ser mantidos no `localStorage`, mas não eram sincronizados entre usuários.

## O que mudou depois

A partir da [Etapa 4](ETAPA_4_INTEGRACAO.md), o Kanban principal passou a consumir a API Spring Boot quando `NEXT_PUBLIC_ORQUESTRIA_API_URL` está configurada. O modo local continua apenas como alternativa demonstrativa. Portanto, **a descrição acima registra a versão inicial**, não a arquitetura completa atual.
