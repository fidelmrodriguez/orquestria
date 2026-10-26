# Usabilidade e acessibilidade

O Orquestria oferece interação com o Kanban por mouse, toque e teclado. As melhorias de interface procuram manter os mesmos fluxos de dados e autorização, independentemente do dispositivo.

## Navegação e foco

- Cartões de tarefa são acionáveis com **Enter** ou **Espaço**. A edição do responsável e da coluna também está disponível nos detalhes da tarefa, sem depender de arrastar e soltar.
- Os painéis de detalhes, criação de tarefas e compartilhamento, além das confirmações de exclusão, identificam-se como diálogos, recebem foco na abertura, mantêm **Tab** dentro do painel e oferecem **Escape** para sair quando permitido.
- Após fechar o painel, o foco retorna ao controle que estava ativo, caso continue no documento.
- Os campos obrigatórios do formulário de nova tarefa relacionam mensagens de validação ao campo correspondente e indicam entradas inválidas.
- Mensagens de erro temporárias são anunciadas como alertas; notificações informativas mantêm a semântica de status.
- O menu em telas menores informa se está expandido e oferece um nome acessível.
- Controles acionáveis exibem indicação de foco de teclado, e a interface respeita a preferência por movimento reduzido do sistema operacional.

## Estados vazios e telas pequenas

- Colunas sem tarefas mostram uma ação para criar tarefa. Quando existem tarefas, mas nenhuma corresponde à pesquisa ou filtros, mostram uma mensagem de ausência de resultados, sem sugerir que a coluna está vazia.
- A largura das colunas do Kanban considera telas estreitas; a navegação horizontal permanece disponível.
- O botão de criar tarefa fica temporariamente indisponível durante o envio do formulário, evitando múltiplos cliques.

## Verificação

O frontend inclui testes automatizados de comportamento de teclado e restauração de foco. A compilação e os demais testes continuam definidos no workflow de integração contínua.

Após cada alteração de interface, testar manualmente pelo menos: navegação por teclado, abertura e fechamento de diálogos, foco após exclusões, criação de tarefa com erros de validação, pesquisa sem resultados e uso em largura mobile.
