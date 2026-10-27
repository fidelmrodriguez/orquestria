# Usabilidade e acessibilidade

O Orquestria oferece interação com o Kanban por mouse, toque e teclado. As melhorias de interface procuram manter os mesmos fluxos de dados e autorização, independentemente do dispositivo.

## Navegação e foco

- Cartões de tarefa são acionáveis com **Enter** ou **Espaço**. A edição do responsável e da coluna também está disponível nos detalhes da tarefa, sem depender de arrastar e soltar.
- Os painéis de detalhes e criação de tarefas, além das confirmações de exclusão, identificam-se como diálogos, recebem foco na abertura, mantêm **Tab** dentro do painel e exigem o **X** para fechar os drawers de tarefa (o fundo escuro e Escape não os dispensam). Em confirmações destrutivas, a ação **Cancelar** continua explícita.
- Após fechar o painel, o foco retorna ao controle que estava ativo, caso continue no documento.
- Os campos obrigatórios do formulário de nova tarefa relacionam mensagens de validação ao campo correspondente e indicam entradas inválidas.
- Mensagens de erro temporárias são anunciadas como alertas; notificações informativas mantêm a semântica de status.
- O menu em telas menores informa se está expandido e oferece um nome acessível.
- Controles acionáveis exibem indicação de foco de teclado, e a interface respeita a preferência por movimento reduzido do sistema operacional.

## Estados vazios e telas pequenas

- Colunas sem tarefas mostram uma ação para criar tarefa. Quando existem tarefas, mas nenhuma corresponde à pesquisa ou filtros, mostram uma mensagem de ausência de resultados, sem sugerir que a coluna está vazia.
- A largura das colunas do Kanban considera telas estreitas. Em desktop, o quadro ocupa a altura útil disponível: cada coluna tem sua própria rolagem vertical e a barra horizontal do quadro fica ao pé do espaço de trabalho.
- A criação de coluna fica na barra superior ao lado de **Nova tarefa** e abre um formulário compacto de sobreposição, sem coluna fictícia nem faixa adicional no quadro. O botão **+** em cada cabeçalho de coluna abre uma nova tarefa com a coluna predefinida.
- O menu lateral mantém a equipe visível; em telas de menor altura, somente a lista interna de navegação rola quando não houver espaço suficiente.
- Cada comentário possui sua própria ação de exclusão com confirmação, sem remover a tarefa ou os demais comentários.
- O botão de criar tarefa fica temporariamente indisponível durante o envio do formulário, evitando múltiplos cliques.
- Os painéis laterais exibem um fundo escurecido e bloqueante: clicar fora ou pressionar Escape não os fecha. O usuário sai pelo X do painel, ou o formulário se fecha após a conclusão da criação. Durante uma operação remota, o diálogo de espera é exibido acima dos campos e bloqueia ações. Os controles de responsável, prioridade e coluna no drawer usam listas personalizadas acessíveis, evitando menus de `<select>` nativos desenhados acima do overlay pelo navegador.
- Ao arrastar uma tarefa, o cartão acompanha o ponteiro e sai visualmente da coluna de origem. A coluna de destino recebe uma borda destacada; soltar na origem ou fora do quadro não envia requisições.
- O botão de compartilhamento por link não integra a interface: a associação de membros à equipe não concede acesso a projetos privados.

- Ao editar o nome de uma coluna, a contagem de tarefas e os atalhos de criação e exclusão ficam ocultos temporariamente; os botões de salvar e cancelar continuam visíveis. A tela principal não apresenta a faixa permanente de ambiente Java/PostgreSQL nem a faixa de contagem de colunas. Erros reais de conexão continuam sendo exibidos.

## Verificação

O frontend inclui testes automatizados de comportamento de teclado e restauração de foco. A compilação e os demais testes continuam definidos no workflow de integração contínua.

Após cada alteração de interface, testar manualmente pelo menos: navegação por teclado, abertura e fechamento de diálogos, foco após exclusões, criação de tarefa com erros de validação, pesquisa sem resultados e uso em largura mobile.

## Edição de tarefas e organização do quadro

- O título da tarefa pode ser alterado no painel lateral usando **Editar**, com confirmação por Enter ou pelo botão Salvar e cancelamento por Escape ou Cancelar.
- O campo de tags mantém as sugestões do catálogo e aceita inclusão tanto por Enter quanto pelo botão **Adicionar** na mesma linha.
- O drag-and-drop permite reordenar tarefas dentro da mesma coluna, inserindo-as antes ou depois de outro cartão. Um espaço azul animado antecipa a posição de destino, e o cartão arrastado acompanha o cursor.
- Arrastos cancelados, solturas fora das colunas e movimentos para a posição original não enviam requisições de gravação.
- A ordem é armazenada pelo backend, mantendo-se após atualização da página. A mudança entre colunas reorganiza tanto a origem quanto o destino.

## Navegação do Kanban em celulares e tablets

- Em telas menores que 1024 px, o quadro exibe **uma coluna por vez** em largura integral, sem barra de rolagem horizontal. Os cartões acompanham o fluxo vertical natural da página, sem duas barras de rolagem concorrentes.
- O seletor acima da coluna informa a posição atual (por exemplo, **Coluna 2 de 5**), o nome e a quantidade de tarefas. Os botões anterior/próxima e a lista de todas as colunas permitem navegar diretamente, mesmo em quadros grandes.
- O botão **Nova tarefa em [nome da coluna]** abre o formulário já associado à coluna selecionada; os atalhos no cabeçalho da coluna continuam disponíveis.
- Ao trocar de workspace/projeto, o navegador volta à primeira coluna daquele quadro. Se a coluna selecionada for removida, a visualização retorna automaticamente à primeira coluna válida.
- Em telas desktop (a partir de 1024 px), o quadro mantém a visualização de múltiplas colunas, o drag-and-drop e a rolagem horizontal no rodapé. Em telas menores, as tarefas podem ser movidas entre colunas pelo campo **Coluna** no painel de detalhes.
