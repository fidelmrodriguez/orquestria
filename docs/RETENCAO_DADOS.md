# Retenção de dados e manutenção automática

O Orquestria executa uma tarefa de manutenção diária em um runner do GitHub Actions, sem depender da API Spring Boot estar acordada. A rotina opera diretamente no PostgreSQL por uma conexão TLS disponibilizada nos GitHub Secrets, e não recebe requisições do público.

## Política de retenção

| Dados | Política |
|---|---|
| Conta Guest | Nunca é excluída |
| Tarefas Guest | Após 30 dias sem atualização nem comentários recentes; lotes de até 250 por execução |
| Projetos Guest | Após 45 dias, **somente vazios** e sem colunas criadas recentemente; até 50 por execução |
| Workspaces Guest | Após 60 dias, **somente sem projetos**; até 50 por execução |
| Sessões expiradas | Removidas diariamente, até 2.000 por execução |
| Contas pessoais ativas | Preservadas mesmo sob pressão de armazenamento |
| Contas pessoais antigas | Só entram em avaliação com armazenamento >= 85% do limite configurado, após >= 180 dias de inatividade. Precisam permanecer candidatas por mais 30 dias e passar por nova verificação antes de qualquer exclusão. No máximo 1 conta removida por dia. |
| Capacidade normal / cota não configurada | Nenhuma conta pessoal é excluída. Marcações antigas são canceladas. |

A rotina não exclui contas por idade isoladamente. Uma autenticação bem-sucedida ou uso da API com sessão válida atualiza o marco de atividade e cancela a marcação de exclusão. O cadastro apresenta a política de retenção ao usuário.

**Consequência da exclusão de uma conta pessoal:** projetos, tarefas, comentários, workspaces, tags e vínculos de equipe dessa conta são apagados. Referências a essa pessoa como responsável em tarefas de outras contas são removidas, sem excluir as tarefas delas. A exclusão não pode ser desfeita pela aplicação.

## Configuração inicial obrigatória (uma vez)

No repositório GitHub, abra **Settings → Secrets and variables → Actions**:

1. Em **Secrets**, crie `ORQUESTRIA_MAINTENANCE_DATABASE_URL`. Cole a connection string PostgreSQL **do banco de produção correto**, preferencialmente a conexão direta Neon, com `sslmode=require`. Nunca salve essa string no código, no README, nos logs ou em uma variável pública.
2. Em **Variables**, crie `ORQUESTRIA_DATABASE_LIMIT_BYTES` com o limite de armazenamento aplicável ao banco/projeto. Exemplo **somente para projetos com cota de 1 GiB**: `1073741824`. Confirme seu plano no painel Neon; não presuma que todo projeto tenha essa cota.
3. Faça o commit do workflow `.github/workflows/maintenance.yml`, da migração Flyway V9 e do script. Aguarde o backend aplicar V9 no Blitz. O GitHub executará a limpeza automaticamente todos os dias às **04:23 UTC**. Nenhum botão ou acesso ao site é necessário após essa configuração.

Sem o **secret**, o job falha de forma explícita e não altera o banco. Sem a **variable do limite**, a limpeza de Guest e sessões funciona, mas a exclusão de contas pessoais permanece bloqueada. Nenhuma credencial é exposta pelo script nos logs.

## Monitoramento e segurança operacional

O workflow registra somente contagens agregadas e estimativa do tamanho do banco, nunca nomes, e-mails, IDs, senhas ou tokens. Em **Actions → Orquestria - manutenção automática do banco** é possível acompanhar cada execução.

A rotina emprega transação SQL única, lock entre execuções, limitação de lotes, validação da existência da conta Guest e checagem da migração V9. Se alguma instrução SQL falhar, a transação é revertida. O workflow possui timeout de 15 minutos.

A leitura `pg_database_size(current_database())` representa o tamanho físico aproximado do banco PostgreSQL, **não necessariamente o consumo faturável/medido pelo Neon**, que pode envolver branches e histórico. Mesmo após exclusões, esse tamanho pode não cair imediatamente (PostgreSQL pode reutilizar espaço liberado). Confira a métrica real e a cota no painel Neon; não use esta rotina como substituto de alertas, backups ou monitoramento de armazenamento.

Uma nova conta nunca é apagada por pressão de armazenamento. Se a capacidade ficar crítica antes de existirem candidatos legítimos, o processo registra a pressão sem remover contas ativas. Considere aumentar a capacidade do projeto.

## Auditoria e validação

Testes da política sem banco nem credenciais:

```bash
python -m unittest discover -s scripts/tests -p test_db_maintenance.py -v
```

Antes da publicação, valide o CI e o startup do backend (Flyway V9). Para execuções de manutenção em banco de produção, confirme sempre que o secret aponta para o projeto correto.

Não são necessárias novas variáveis no Netlify ou no Blitz: todas as operações agendadas acontecem no GitHub e no Neon.

## Limitação do agendador GitHub

Em repositórios públicos, o GitHub pode desativar o cron automaticamente após 60 dias sem atividade no repositório. Nessa situação, não existe garantia de execução contínua sem intervenção. Para retenção realmente permanente em projetos que permanecerão sem commits, use um agendador externo confiável (por exemplo, um Neon Function Trigger compatível com scale-to-zero) e monitore a última execução bem-sucedida. O GitHub Actions é uma opção prática, mas requer conferência periódica desse status.
