# LittleBoatPoll

Um bot de Discord feito especialmente e sob medida para o canal de Discord Tripulação de Papel, com sistema de votações ponderadas para escolhas do clube do livro.

## 🚀 Quick Start para Desenvolvedores

Se você quer **contribuir ou configurar localmente**:

1. **Leia:** [docs/development/SETUP.md](docs/development/SETUP.md) (~5 minutos)
2. **Execute:** Clone, `npm install`, preencha `.env`, `npm test`
3. **Contribua:** Leia [CONTRIBUTING.md](CONTRIBUTING.md) e [docs/development/GIT-WORKFLOW.md](docs/development/GIT-WORKFLOW.md)

Para documentação técnica completa, veja [docs/](docs/) (setup Discord, staging, arquitetura, etc.)

---

## Permissões

Sistema binário **interno** para permissões administrativas:

- **Criador de Enquetes**: Usuários adicionados internamente com `/criador-de-enquete adicionar`
- **Administrador e dono do servidor**: acesso total automático
- **Usuário comum**: apenas vota por reações

Não existem níveis intermediários para permissões administrativas. O sistema é gerenciado internamente pelo bot.

### Mensalistas por cargo do servidor

O bot também faz vínculo automático do cargo **Mensalistas** (nome do cargo no Discord) com o papel interno de mensalista:

- Se o cargo existir, qualquer membro com esse cargo é reconhecido como mensalista automaticamente.
- Não é necessário criar um novo cargo se **Mensalistas** já existir no servidor.
- O vínculo é salvo em `role-bindings.json` para persistir entre reinícios.
- Se o cargo não existir, o bot mantém o comportamento padrão atual (lista manual em `mensalistas.json`).

### Gerenciar Criadores

**Via Discord:**

```bash
/criador-de-enquete adicionar @usuario   # Adiciona permissão administrativa
/criador-de-enquete remover @usuario     # Remove permissão
/criador-de-enquete listar               # Lista todos os criadores
```

Ou use o **Context Menu** (botão direito no usuário → Apps → "Add/Del Criador de Enquetes")

📖 **Leia mais:** [Documentação de Migração](docs/technical/MIGRACAO-PERMISSOES-INTERNAS.md)

## Requisitos

- Node.js >= 22
- npm
- Token do bot e client ID

## Instalação

```bash
npm install
```

Crie o arquivo `.env`:

```env
TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_ID=seu_client_id_oauth
DISCORD_CLIENT_SECRET=seu_client_secret_oauth
DISCORD_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/discord/callback
DASHBOARD_SESSION_SECRET=troque_este_secret
DASHBOARD_ALLOWED_GUILD_ID=id_da_guild
```

## Executar

```bash
npm start
```

Registrar comandos manualmente:

```bash
npm run deploy
```

Registrar comandos automaticamente na inicialização:

```env
DEPLOY=true
```

## Dashboard Web

O dashboard administrativo usa frontend React + backend Express com login Discord OAuth2.

Comandos úteis:

```bash
npm run dashboard:frontend:install
npm run dashboard:frontend:dev
npm run dashboard:frontend:build
```

Endpoints de autenticação:

- `/api/auth/discord/login`
- `/api/auth/discord/callback`
- `/api/auth/me`
- `/api/auth/logout`

## 🧪 Bot de Homologação (Staging)

O projeto suporta execução em dois ambientes isolados:

- **Produção** (`APP_ENV=prod`) - Bot principal com dados em `data/environments/prod/`
- **Staging** (`APP_ENV=staging`) - Bot de testes com dados em `data/environments/staging/`

### 📁 Arquivos de dados por ambiente

Cada ambiente usa a mesma estrutura de arquivos, mudando apenas a pasta (`data/environments/prod/` ou `data/environments/staging/`):

- `active-polls.json`
- `draft-polls.json`
- `mensalistas.json`
- `criadores-internos.json`
- `historico-votacoes.json`
- `role-bindings.json` (**vínculo automático do cargo Mensalistas**)

> ✅ Em produção, edite os arquivos em `data/environments/prod/`.
> ✅ Em homologação, edite os arquivos em `data/environments/staging/`.

### Executar bot de staging

**Todas as plataformas (Windows/Linux/Mac):**

```bash
npm run start:staging
```

**Ou manualmente:**

Windows (PowerShell):

```powershell
$env:APP_ENV="staging"; npm start
```

Linux/Mac:

```bash
APP_ENV=staging npm start
```

O bot de staging permite validar funcionalidades "em loco" (no Discord real) sem afetar produção:

- ✅ Mesmo código-fonte, zero duplicação
- ✅ Dados completamente isolados por ambiente
- ✅ Token/Client ID próprios (crie segundo bot no Discord Developer Portal)
- ✅ Execução sob demanda, apenas quando necessário

📖 **Guia completo:** [Bot de Homologação](docs/staging-bot.md)

## Testes

### Testes Unitários

Cobertura automática de 100% dos módulos utilitários usando Jest:

```bash
npm test              # Executa todos os testes unitários
npm run test:watch    # Modo watch (re-executa ao salvar)
npm run test:coverage # Relatório de cobertura de código
```

**Módulos testados:**

- `utils/validators.js` - Validação de enquetes e opções
- `utils/draft-handler.js` - Manipulação de rascunhos
- `utils/constants.js` - Constantes do sistema
- `utils/mensalista-binding.js` - Vínculo automático de mensalistas

### Testes de Integração (Automatizados)

Suite que simula usuários reais interagindo com o bot staging, validando funcionalidades fim-a-fim:

```bash
npm run test:full     # Forma recomendada (inicia bot, testa, para bot)
```

**Ou manualmente (2 terminais):**

```bash
npm run start:staging # Terminal 1: Inicia bot staging
npm run test:automation # Terminal 2: Executa testes
```

Cenários validados:

- ✅ Criação de enquetes
- ✅ Votação (adicionar/remover votos)
- ✅ Limites de votação e reações
- ✅ Permissões administrativas

📖 **Documentação completa:** [Testes Automatizados](test-bot/AUTOMATION.md)
