# Exemplos de uso da API

Exemplos em Bash para inspecionar contratos da API REST. Use uma **conta de teste própria**: os comandos de criação gravam dados reais no ambiente indicado por `API_URL`. Não executar exclusões nem testes destrutivos no banco de produção sem necessidade.

Pré-requisitos: `curl` e `jq`, além de credenciais válidas. Os exemplos usam o serviço publicado; substitua `API_URL` caso esteja verificando outro ambiente.

## 1. Saúde e disponibilidade

```bash
export API_URL='https://orquestria-api.fidelmrodriguez.blitz.cloud'
curl -i "$API_URL/actuator/health"
```

Quando a API estiver ativa, a resposta deverá conter `"status":"UP"`. No plano atual, a primeira requisição pode encontrar a hospedagem em inicialização.

## 2. Autenticação

O cadastro recebe `name`, `username`, `email` e `password`. Para autenticar uma conta existente, use `identifier` (nome de usuário ou e-mail) e `password`. O exemplo abaixo lê a senha sem mostrá-la no terminal nem gravá-la no histórico de comandos.

```bash
read -rp 'Usuário ou e-mail: ' ORQ_IDENTIFIER
read -rsp 'Senha: ' ORQ_PASSWORD; printf '\n'
LOGIN_PAYLOAD="$(printf '%s' "$ORQ_PASSWORD" | jq -Rs --arg identifier "$ORQ_IDENTIFIER" \
  '{identifier: $identifier, password: .}')"
unset ORQ_IDENTIFIER ORQ_PASSWORD
ORQ_TOKEN="$(printf '%s' "$LOGIN_PAYLOAD" \
  | curl --fail-with-body -sS -X POST "$API_URL/api/auth/login" \
      -H 'Content-Type: application/json' --data-binary @- \
  | jq -r '.token // empty')"
unset LOGIN_PAYLOAD
test -n "$ORQ_TOKEN" && echo 'Token recebido.'
```

Não imprima o valor de `ORQ_TOKEN`, não o coloque em arquivos versionados e não compartilhe respostas de login. Tokens gerados podem ser revogados pelo logout.

Valide a identidade autenticada:

```bash
curl --fail-with-body -sS "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $ORQ_TOKEN" | jq .
```

## 3. Criar workspace e projeto descartáveis

```bash
WORKSPACE_JSON="$(curl --fail-with-body -sS -X POST "$API_URL/api/workspaces" \
  -H "Authorization: Bearer $ORQ_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"name":"Workspace de teste","description":"Fluxo de verificação"}')"
WORKSPACE_ID="$(printf '%s' "$WORKSPACE_JSON" | jq -r '.id')"

PROJECT_JSON="$(jq -n --arg workspaceId "$WORKSPACE_ID" \
  '{name:"Projeto de teste", description:"Projeto descartável", workspaceId:$workspaceId}' \
  | curl --fail-with-body -sS -X POST "$API_URL/api/projects" \
      -H "Authorization: Bearer $ORQ_TOKEN" \
      -H 'Content-Type: application/json' --data-binary @-)"
PROJECT_ID="$(printf '%s' "$PROJECT_JSON" | jq -r '.id')"

curl --fail-with-body -sS "$API_URL/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $ORQ_TOKEN" | jq .
```

A API responde `201 Created` na criação desses recursos; IDs são UUIDs. Os comandos usam o `workspaceId` retornado, evitando depender de nomes repetidos.

## 4. Criar coluna e tarefa

```bash
COLUMN_JSON="$(curl --fail-with-body -sS -X POST "$API_URL/api/projects/$PROJECT_ID/columns" \
  -H "Authorization: Bearer $ORQ_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"title":"Planejado","position":0,"color":"#3b82f6"}')"
COLUMN_ID="$(printf '%s' "$COLUMN_JSON" | jq -r '.id')"

jq -n --arg columnId "$COLUMN_ID" \
  '{title:"Validar documentação",description:"Tarefa criada pela API",columnId:$columnId,priority:"MEDIA",position:0,tags:["documentacao"]}' \
  | curl --fail-with-body -sS -X POST "$API_URL/api/projects/$PROJECT_ID/tasks" \
      -H "Authorization: Bearer $ORQ_TOKEN" \
      -H 'Content-Type: application/json' --data-binary @- | jq .
```

A propriedade `columnId` é obrigatória para criar uma tarefa. As prioridades aceitas pelo backend são `BAIXA`, `MEDIA`, `ALTA` e `CRITICA`.

## 5. Conferir erros e encerrar a sessão

Uma consulta privada sem token deve ser rejeitada; recursos de outra conta não devem ser retornados por conhecer seu UUID. A API retorna respostas `401` para sessões inválidas e `404` para recursos privados não acessíveis.

```bash
curl -i "$API_URL/api/projects"
curl -i -X POST "$API_URL/api/auth/logout" \
  -H "Authorization: Bearer $ORQ_TOKEN"
unset ORQ_TOKEN WORKSPACE_JSON WORKSPACE_ID PROJECT_JSON PROJECT_ID COLUMN_JSON COLUMN_ID
```

O logout encerra a sessão correspondente. Recursos criados para o teste devem ser removidos pela interface autenticada, respeitando a ordem de dependências. Para operações e códigos adicionais, consulte a [referência da API](API.md).
