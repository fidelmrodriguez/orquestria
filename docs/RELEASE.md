# Publicação da versão 1.0.0

Este documento reúne as verificações para publicar uma versão identificável e reproduzível do Orquestria. O código do frontend, da API e as migrações de banco são publicados separadamente. A tag `v1.0.0` deve apontar para um commit testado, **não** para um estado ainda em validação.

## Pré-condições

- A branch `main` está sincronizada, sem alterações locais pendentes.
- A execução do **Orquestria CI** para o commit escolhido terminou com os jobs **Backend** e **Frontend** aprovados. Não confundir o resultado de um commit anterior com o commit a ser publicado.
- O deploy do backend no Blitz e o deploy do frontend no Netlify correspondem a versões compatíveis.
- O Flyway validou e aplicou as migrações versionadas de `V1` a `V9` no ambiente correspondente. Mudanças posteriores exigem migrações novas.
- Os testes de fluxo abaixo foram repetidos na aplicação publicada, com contas e dados descartáveis.

## Checklist funcional de aceite

Marque os itens apenas após a execução no ambiente publicado.

### Entrada e continuidade da sessão

- [ ] Abrir [Orquestria](https://orquestria.netlify.app/) em uma janela sem sessão e aguardar a API acordar; a tela de preparação não deve ser confundida com erro de login.
- [ ] Efetuar cadastro de conta pessoal, entrar por usuário e por e-mail e verificar a sessão em `/api/auth/me`.
- [ ] Atualizar a página (F5) e abrir uma nova aba, verificando a restauração de sessão.
- [ ] Sair da conta e confirmar que os dados privados não são acessíveis sem autenticação.
- [ ] Acessar a conta de demonstração, lembrando que o conteúdo nela é compartilhado.

### Quadro e regras de negócio

- [ ] Criar workspace, projeto, coluna pelo botão superior e tarefa pelo botão de uma coluna; editar título, descrição, prioridade e prazo.
- [ ] Mover uma tarefa entre colunas pelo Kanban e pelo seletor nos detalhes; atualizar a página e verificar persistência.
- [ ] Criar comentário, excluir um comentário individual e confirmar que os demais foram preservados após atualizar.
- [ ] Criar tags, usar sugestões de tags existentes, editar e remover chips de uma tarefa.
- [ ] Pesquisar usuários cadastrados, adicionar um membro e atribuir uma tarefa a ele.
- [ ] Verificar que membro com tarefa atribuída não pode ser removido antes da reatribuição.
- [ ] Excluir tarefa descartável e coluna vazia; confirmar que coluna ocupada permanece protegida.
- [ ] Excluir projeto descartável e workspace vazio; verificar proteção do workspace com projetos.
- [ ] Confirmar que `Gerenciar itens` e os atalhos contextuais continuam disponíveis.
- [ ] Entrar com outra conta pessoal e verificar que não enxerga workspaces e projetos privados da primeira.

### Interface e operação

- [ ] Verificar a navegação por teclado: Tab, Enter/Espaço nos cartões, foco retido nos drawers e fechamento dos drawers apenas pelo X (não pelo fundo ou Escape).
- [ ] Abrir o site em largura mobile e conferir menu, navegação de uma coluna por vez (sem rolagem horizontal), formulários e busca compacta. No desktop, conferir a sidebar recolhível e a rolagem horizontal do quadro.
- [ ] Conferir que os dois temas e os estados vazios/erros continuam legíveis.
- [ ] Confirmar que indisponibilidade transitória do backend não apaga a sessão por erro de rede.
- [ ] Verificar a rota de prontidão `/api/orquestria-readiness` quando a API estiver disponível.
- [ ] Conferir que respostas da API não revelam erros internos; quando aplicável, registrar `X-Request-ID` para diagnóstico.

## Procedimento de publicação

1. Revisar o diff, confirmar o resultado do CI **no commit atual** e verificar os deploys do Blitz e do Netlify.
2. Executar o checklist acima com dados de teste que possam ser apagados.
3. Confirmar que não existem segredos em arquivos versionados, mensagens, exemplos ou capturas de tela.
4. Somente após o aceite, criar a tag anotada no Codespaces:

```bash
git status
git log -1 --oneline
git tag -a v1.0.0 -m "Orquestria 1.0.0"
git push origin v1.0.0
```

5. Se desejar, publicar uma GitHub Release associada à tag, usando as notas do [CHANGELOG](../CHANGELOG.md) e o endereço da aplicação. Não divulgar uma versão como validada sem verificar os critérios acima.

A tag não publica automaticamente Java no Blitz nem substitui a publicação do Netlify. São fluxos separados; os provedores e a configuração de cada um devem ser verificados.

## Reversão e recuperação

- **Falha apenas de interface:** utilizar o recurso de rollback do Netlify para reativar um deploy estático anterior compatível com a API.
- **Falha da API:** consultar os logs correlacionados por `X-Request-ID`; redeployar uma versão do backend que permaneça compatível com o esquema presente.
- **Mudança de banco:** migrações Flyway aplicadas não são desfeitas ao reverter código. Não executar `flyway clean` em produção; avaliar recuperação a partir de backup e restauração em ambiente isolado se necessário.
- **API dormindo:** a suspensão do processo no plano gratuito do Blitz não é, isoladamente, uma falha de release. Verifique o comportamento da tela de preparação antes de diagnosticar indisponibilidade.

## Evidências e limites conhecidos

Manter o resultado da execução do CI, a referência do commit/tag e o estado dos deploys. Capturas de tela podem ser incluídas após revisão, utilizando uma conta com conteúdo de demonstração legível e sem dados pessoais.

A conta guest é compartilhada; membros de equipe são responsáveis atribuíveis, **não** colaboradores com acesso a projetos privados; não existem permissões compartilhadas por convite, recuperação de senha, rate limiting distribuído ou disponibilidade contínua garantida no plano gratuito da API. Consulte [Segurança e operação](SEGURANCA_OPERACAO.md) e [Roadmap](ROADMAP.md).
