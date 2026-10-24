# Publicação do backend sem instalar programas

O site do Orquestria continua no Netlify. O Spring Boot deve rodar em um serviço que execute Java, e o PostgreSQL fica no Neon.

## 1. Criar banco no Neon

1. Abra https://console.neon.tech/ e crie um projeto gratuito chamado `orquestria`.
2. Em **Connect**, selecione a branch e o banco padrão. Para o Flyway, prefira **Direct connection** (desative Connection pooling).
3. Escolha o formato JDBC/Java se disponível. Se vier uma URL `postgresql://usuario:senha@HOST/BANCO?sslmode=require`, divida assim:
   - `DB_URL`: `jdbc:postgresql://HOST/BANCO?sslmode=require`
   - `DB_USER`: usuário apresentado pelo Neon
   - `DB_PASSWORD`: senha da conexão
   Não deixe usuário e senha dentro de `DB_URL` quando já usar as variáveis separadas.
4. **Não publique nenhuma dessas três informações no GitHub, Netlify, prints ou README.** Coloque-as apenas nos campos privados do Render.

## 2. Deploy do backend no Render

1. Abra https://dashboard.render.com/ e entre com GitHub.
2. Clique em **New > Blueprint**, escolha `fidelmrodriguez/orquestria`, branch `main`.
3. O arquivo `render.yaml` cria um serviço Web gratuito `orquestria-api` com build Docker.
4. Preencha `DB_URL`, `DB_USER`, `DB_PASSWORD` quando o Render solicitar. Plano deve estar **Free**.
5. Aguarde o deploy. O Docker executa `mvn clean verify` no serviço de build e inicia o Java 21.
6. Veja **Logs** no Render. O Flyway deve criar a tabela `projects` no banco Neon.
7. Copie o endereço HTTPS real mostrado pelo Render. Não presuma que o subdomínio será `orquestria-api.onrender.com`.

### Teste direto no navegador

- `https://SEU-SERVICO.onrender.com/actuator/health` retorna `{"status":"UP"}`.
- `https://SEU-SERVICO.onrender.com/api/projects` retorna `[]` antes de cadastrar o primeiro projeto.
- Uma instância gratuita pode ficar inativa após 15 minutos sem acesso e demorar a iniciar novamente.

## 3. Ligar a página de diagnóstico do Netlify à API

1. No Netlify, abra **Project configuration > Environment variables**.
2. Adicione `NEXT_PUBLIC_ORQUESTRIA_API_URL` com a URL HTTPS do Render **sem barra no final**.
3. Faça um novo deploy do frontend (o Next.js exporta HTML estático; a variável é incorporada durante o build).
4. Acesse https://orquestria.netlify.app/diagnostico/ .
5. Clique em **Verificar conexão e listar projetos**, depois crie um projeto com dados fictícios e consulte novamente.
6. A verificação deve continuar mostrando o projeto após atualizar a página: ele está no Neon, não no localStorage.

### Se der erro

- **Render > Logs**: erros de inicialização, banco, credenciais e migrações Flyway.
- **Netlify > Deploys > Deploy log**: erros na compilação do Next.js.
- **Navegador > DevTools > Network/Console**: requisições à API e erros de CORS.
- `Failed to fetch` pode indicar serviço inativo, endereço errado ou CORS. Aguarde o serviço gratuito acordar e teste `health` diretamente.
- Se a origem do seu site mudar, defina `APP_CORS_ALLOWED_ORIGIN` no Render com a origem exata (sem `/` final), por exemplo `https://orquestria.netlify.app`.

## Segurança e escopo

A API de projetos ainda não tem autenticação: a rota de criação é pública. **Use somente dados fictícios**, não dados pessoais. A página `/diagnostico/` é temporária. Antes de divulgar o backend como serviço pronto, implemente Spring Security e controle de acesso. CORS não substitui autenticação.

A tela principal do Orquestria ainda não usa a API: o objetivo desta etapa é testar a conexão HTTP, as migrações e a persistência no navegador, sem precisar instalar programas localmente.
