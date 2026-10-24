# Deploy da Orquestria no Netlify

O deploy atual é **somente do frontend Next.js**. O diretório `backend/` está reservado para o futuro Spring Boot e **não precisa** de deploy neste momento.

## 1. Publique o repositório no GitHub

Na raiz do projeto:

```bash
git init
git add .
git commit -m "feat: publica frontend Orquestria e prepara estrutura fullstack"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Substitua `SEU_USUARIO` e `SEU_REPOSITORIO` pelo repositório que você criar.

## 2. Conecte o GitHub ao Netlify

1. No Netlify, crie um projeto **Import an existing project** e selecione o repositório no GitHub.
2. Verifique se o Netlify está lendo o `netlify.toml` da raiz.
3. Configuração esperada para este pacote:

   | Campo | Valor |
   | --- | --- |
   | Base directory | `frontend` |
   | Build command | `npm run build` |
   | Publish directory | `.next` (relativa à base `frontend`) |
   | Node.js | `20` |

4. Inicie o deploy. O Netlify detecta o Next.js e usa seu adaptador para publicar a aplicação. Não é necessário instalar ou fixar manualmente o plugin Next.js.
5. Quando gerar o endereço `https://SEU-SITE.netlify.app`, copie-o para o campo **Demonstração** do `README.md`.

> Atenção: se você já selecionou uma configuração automática diferente na interface do Netlify, evite configurar caminhos conflitantes. Neste projeto, o `netlify.toml` é a referência para **base**, **build** e **publish**.

## 3. Checklist de publicação

- [ ] A aplicação abre na URL Netlify.
- [ ] A tela de acesso demonstrativo funciona.
- [ ] O quadro carrega os dados iniciais (quando DummyJSON está disponível).
- [ ] É possível adicionar e mover tarefas.
- [ ] O estado permanece após atualizar a mesma aba do navegador.
- [ ] A visualização mobile e o tema claro/escuro funcionam.
- [ ] O endereço público foi adicionado ao README.

## 4. Quando houver backend Java

Mantenha a API Spring Boot na pasta `backend/`, mas publique-a em serviço que execute aplicações Java continuamente. A API pode usar PostgreSQL hospedado separadamente (por exemplo, Neon ou Supabase), e o frontend no Netlify passará a consumir sua URL HTTPS.

Nesse estágio, será necessário configurar variável de ambiente para a URL da API, CORS, autenticação e um fluxo de deployment específico para o backend. **Nada disso está configurado nesta primeira entrega.**
