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
- O botão de compartilhamento por link não integra a interface: o acesso de membros é concedido diretamente por projeto, com escopo definido no backend.

- Ao editar o nome de uma coluna, a contagem de tarefas e os atalhos de criação e exclusão ficam ocultos temporariamente; os botões de salvar e cancelar continuam visíveis. A tela principal não apresenta a faixa permanente de ambiente Java/PostgreSQL nem a faixa de contagem de colunas. Erros reais de conexão continuam sendo exibidos.

## Verificação

O frontend inclui testes automatizados de comportamento de teclado e restauração de foco. A compilação e os demais testes continuam definidos no workflow de integração contínua.

Após cada alteração de interface, testar manualmente pelo menos: navegação por teclado, abertura e fechamento de diálogos, foco após exclusões, criação de tarefa com erros de validação, pesquisa sem resultados e uso em largura mobile.

## Edição de tarefas e organização do quadro

- O título da tarefa pode ser alterado no painel lateral usando **Editar**, com confirmação por Enter ou pelo botão Salvar e cancelamento por Escape ou Cancelar.
- O campo de tags mantém as sugestões do catálogo e aceita inclusão tanto por Enter quanto pelo botão **Adicionar** na mesma linha.
- A partir de **1024 px**, o drag-and-drop permite reordenar tarefas dentro da mesma coluna e movê-las entre colunas. Um indicador azul discreto mostra a posição de destino, enquanto a prévia acompanha o cursor.
- Não é necessário acertar o vão entre os cartões: durante o arrasto, sobrepor parte de um cartão já define uma inserção. Ao mover de cima para baixo, a parte principal do cartão indica **depois**; ao mover de baixo para cima, indica **antes**. Uma faixa estreita na extremidade ainda permite a posição oposta.
- O destino é calculado com um snapshot das posições dos cartões capturado no início do arraste. O movimento da prévia usa `translate3d`, com no máximo uma atualização por frame, sem recalcular a geometria de todos os cartões a cada evento. O indicador de destino evita animações contínuas de sombra.
- Arrastos cancelados, solturas fora das colunas e movimentos para a posição original não enviam requisições de gravação.
- A ordem é armazenada pelo backend, mantendo-se após atualização da página. A mudança entre colunas reorganiza tanto a origem quanto o destino.

## Navegação do Kanban em celulares e tablets

- Em telas menores que 1024 px, o quadro exibe **uma coluna por vez** em largura integral, sem barra de rolagem horizontal. Os cartões acompanham o fluxo vertical natural da página, sem duas barras de rolagem concorrentes.
- O seletor acima da coluna informa a posição atual (por exemplo, **Coluna 2 de 5**), o nome e a quantidade de tarefas. Os botões anterior/próxima e a lista de todas as colunas permitem navegar diretamente, mesmo em quadros grandes.
- Abaixo do seletor, os botões **Nova coluna** (branco) e **Nova tarefa** (preto) dividem a mesma linha. A nova tarefa utiliza a coluna selecionada; o formulário de nova coluna usa o projeto ativo. Os equivalentes no topbar ficam ocultos abaixo de 1024 px.
- Ao trocar de workspace/projeto, o navegador volta à primeira coluna daquele quadro. Se a coluna selecionada for removida, a visualização retorna automaticamente à primeira coluna válida.
- Até **1023 px**, o arraste dos cartões fica desativado para preservar a rolagem por toque. Cada cartão oferece **Mover**, com ações de subir/descer uma posição entre as tarefas visíveis ou enviar para outra coluna; a posição final respeita as tarefas ocultas pelos filtros e é persistida pela mesma API do drag-and-drop.
- A partir de **1024 px**, o quadro mantém múltiplas colunas, arraste com prévia otimizada e rolagem horizontal no rodapé. Os cartões no mobile têm espaçamentos mais compactos, sem ocultar título, prioridade, descrição ou responsável.
- O menu hambúrguer ocupa a viewport inteira, bloqueia a página ao fundo e mantém rolagem independente sem barra de scrollbar visível, preservando alinhamento lateral e acesso a todas as opções.

## Espaçamento e pesquisa nas barras responsivas

- O quadro fica imediatamente abaixo do topbar; em mobile/tablet o espaço reservado acompanha a altura real do cabeçalho fixo. O resumo duplicado do projeto não é mais renderizado acima das colunas.
- Até **1919 px**, a lupa revela uma linha de busca **dentro do fluxo do cabeçalho**, ocupando 100% da largura disponível. A linha empurra o quadro para baixo; fecha com Escape ou clique fora sem apagar o texto digitado. Entre 768 e 1919 px, os filtros ficam na mesma linha do input; abaixo de 768 px, só o input é exibido.
- A partir de **1920 px**, o campo de pesquisa e os filtros permanecem visíveis diretamente na barra superior, sem botão de lupa.
- Os filtros e os controles de busca preservam as regras de filtragem. A alternativa mobile para movimentação reutiliza a operação de organização já existente no store/API.

## Sidebar recolhível em desktop

- A sidebar participa do layout flexível e ocupa 288 px no estado expandido ou 76 px no estado compacto. Ao recolhê-la, a largura liberada passa imediatamente para a área do Kanban, sem sobreposição nem painel fixo cobrindo cartões.
- Na barra compacta, workspaces e projetos permanecem selecionáveis por ícones com `title` e nomes acessíveis. Os links de gerenciamento, equipe e tags continuam disponíveis. A criação e exclusão de recursos permanecem acessíveis ao expandir a sidebar.
- O botão para expandir/recolher é visível, funciona pelo teclado e permite retornar à navegação completa. A barra compacta também mostra abreviações de duas letras para diferenciar workspaces/projetos com ícones iguais. No celular, continua sendo utilizado o menu responsivo original, sem uma segunda sidebar; a alteração de tema permanece no menu mobile.
- A busca compacta fica em uma linha própria no cabeçalho e não usa `position: absolute` nem `z-index` de popover; ao abrir, desloca o conteúdo em vez de cobri-lo.

## Campos de texto e filtros do Kanban

- A busca, a descrição da tarefa e o campo de comentários usam apenas o contorno do respectivo recipiente ao receber foco, evitando contornos internos duplicados. A borda externa continua sinalizando o foco em mouse e teclado, inclusive no tema escuro.
- Os filtros de prioridade e responsável no cabeçalho usam o mesmo seletor acessível das propriedades das tarefas, com lista de opções personalizada, seleção por teclado, destaque do valor ativo e fechamento com Escape ou clique fora. Os filtros mantêm o estado e as regras de filtragem existentes.
- Na navegação mobile, os filtros usam esse mesmo componente dentro do menu, sem `<select>` nativo ou popup desenhado sobre outros diálogos.

## Criação de tarefas, membros e tags

- Após a API confirmar a criação de uma tarefa, o drawer de criação se fecha e a nova tarefa aparece no quadro **sem abrir automaticamente o painel de detalhes**. Erros mantêm o formulário aberto para correção.
- No formulário de tags, o espaço reservado para chips só é exibido quando existe ao menos uma tag. Sem tags, o campo de texto e o botão **Adicionar** aparecem imediatamente, lado a lado.
- O ícone ao lado do título do formulário de login mantém largura e altura fixas ao alternar entre Guest, conta pessoal e cadastro; o texto pode quebrar sem redimensionar o ícone.
- Os seletores de responsável, filtros e contagem de membros usam apenas a lista do projeto ativo. Na página Equipe, o contexto de workspace e projeto aparece antes da inclusão ou remoção.

## Duplicação e formulário unificado de tarefas

- Cada cartão oferece o botão discreto **Duplicar tarefa**, com identificação acessível. O botão não inicia drag-and-drop nem abre o drawer; a cópia fica diretamente abaixo do cartão original, preservando as propriedades, com novos IDs para tarefa e comentários.
- Nos formulários de **Nova tarefa** e **Detalhes da tarefa**, coluna, responsável, prioridade, prazo e tags usam os mesmos componentes, proporções, bordas e largura de drawer. O título novo é preenchido no campo de criação; na edição é exibido como título com botão **Editar**, sem input permanente.
- Somente o painel de detalhes exibe a seção de comentários e a ação de exclusão da tarefa. O formulário de criação mantém o botão de criação no rodapé fixo.
- O campo de busca é identificado apenas como **Buscar** em todas as larguras de tela, sem texto cortado.
- Os avatares de membros da equipe possuem nome no tooltip nativo (mouse) e nome acessível no foco por teclado; o texto da bolinha não pode ser selecionado.
- Ao adicionar uma tag, uma camada de espera apresenta **Salvando tag...** enquanto o cadastro/associação é confirmado; os erros permanecem visíveis após a operação.

## Menu mobile, movimentação e criação de colunas

- Em telas menores que 1024px, o menu hambúrguer ocupa a viewport como diálogo modal, com rolagem em um único contêiner, scrollbar oculto e margem inferior respeitando a área segura do navegador (`env(safe-area-inset-bottom)`). Esc e o botão de fechar retornam à navegação anterior; o conteúdo atrás do menu não rola.
- O seletor mobile apresenta Nova coluna (branco) e Nova tarefa (escuro) lado a lado. O formulário Nova coluna expande uma linha completa **abaixo** dos botões, sem popover absoluto, inclusive quando o teclado virtual está ativo.
- Os cards mobile oferecem Mover: subir, descer ou escolher outra coluna, sem interferir na rolagem por toque. O menu de movimentação usa React Portal, fica acima dos outros cards e fecha por Escape, clique externo ou rolagem da página.
- No desktop, o drag-and-drop mantém prévia e indicador de inserção com traço de 3px, evitando anéis visuais pesados.

## Central de notificações

- A campainha mostra o indicador verde apenas quando existem notificações relevantes ainda não visualizadas. Abrir a central registra como lidas as entradas exibidas; o botão Marcar todas como lidas também permanece disponível. O estado é mantido no navegador.
- Notificações de operações são produzidas **após confirmação** no modo API: criação de workspaces, projetos, colunas e tarefas, edição, movimentação, duplicação e comentários. Erros de API não geram avisos falsos de sucesso; login e sincronização de dados não acendem a campainha.
- São exibidos lembretes para tarefas atribuídas ao usuário atual que estão vencidas, vencem hoje ou em até três dias. Avisos de tarefas oferecem Abrir tarefa quando o card ainda existe.
- Esta central é um recurso local da aplicação web, não um serviço de push: não entrega mensagens enquanto o aplicativo está fechado, não sincroniza a leitura entre navegadores e não observa alterações de outros usuários sem um fluxo de atualização explícito.

## Refinamentos para navegadores móveis

- **Acesso prioritário:** abaixo de 1024 px, o formulário de login ou cadastro aparece antes do conteúdo institucional. No desktop, a apresentação permanece à esquerda e o formulário à direita; a autenticação em si não muda.
- **Gerenciar itens:** nomes de workspaces, projetos, colunas e tarefas sem espaços passam a quebrar em mais de uma linha quando atingem a borda do cartão. A largura da grade permanece limitada à viewport, sem exigir rolagem horizontal.
- **Menu de navegação:** a região com rolagem usa um pequeno padding inferior e `env(safe-area-inset-bottom)`, em vez de reservar 112px vazios após **Sair**. O botão inteiro permanece visível ao rolar até o final no Chrome Android. A scrollbar permanece invisível, sem impedir o gesto vertical.
- **Identidade e troca de conta:** o menu mostra o nome da conta autenticada com iniciais; o estado aberto é associado ao ID do usuário e é zerado antes do logout, evitando reabrir o menu automaticamente depois de entrar em outra conta. O fechamento por Escape, pelo X e pela navegação continua disponível.
- **Aguardando a API:** no celular, a tela **Preparando seu ambiente** reduz ícone, espaçamentos e textos explicativos; preserva status, contador e a informação de que o servidor pode demorar a despertar. As consultas de prontidão e a transição automática não mudam.
- **Filtros:** as setas dos menus de prioridade e responsável mantêm uma margem interna em telas pequenas, sem alterar o comportamento de teclado nem a seleção.

Verificação manual recomendada: Chrome Android com barras de endereço e navegação visíveis, nomes de projeto longos sem espaços, menu aberto até alcançar **Sair** sem cortes ou espaços excessivos, troca de contas com o menu inicialmente fechado, filtros estreitos, inicialização compacta da API e entrada inicial no login sem rolar.
