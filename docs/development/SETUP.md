# Setup Local - Little Boat Poll

Guia rápido para configurar seu ambiente de desenvolvimento local (~5 minutos).

## Pré-requisitos

- **Node.js** 22.x ou superior ([Baixar](https://nodejs.org))
- **Git** 2.x ou superior ([Baixar](https://git-scm.com))
- **Discord Developer Portal** account com permissão para criar aplicações

## Step 1: Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/LittleBoatPoll.git
cd LittleBoatPoll
git checkout develop  # Sempre trabalhe na branch develop
```

## Step 2: Instalar Dependências

```bash
npm install
```

Se encontrar erro, tente limpar cache:

```bash
npm cache clean --force
npm install
```

## Step 3: Configurar Variáveis de Ambiente

1. Copie o template:

   ```bash
   cp .env.example .env
   ```

2. Preencha o arquivo `.env` com seus valores:

   **Para Discord Dev Portal:**
   - Vá para https://discord.com/developers/applications
   - Clique em "New Application"
   - Na seção "General Information", copie **Application ID** → `CLIENT_ID`
   - Vá em "Bot" → "Token" → "Copy" → `TOKEN`

   **.env preenchido:**

   ```env
   TOKEN=seu_token_super_secreta_aqui
   CLIENT_ID=seu_client_id_aqui
   APP_ENV=prod
   DEBUG=false
   DEPLOY=true
   ```

   > ⚠️ **IMPORTANTE:** Nunca commite o arquivo `.env` com tokens reais!

## Step 4: Verificar Setup

```bash
npm test
```

Se ver "Tests passed" e um relatório de coverage gerado, seu setup está correto! ✅

## Step 5: Iniciar o Bot (Opcional)

```bash
npm start          # Inicia bot com deploy de comandos
npm run dev        # Inicia em modo watch (recarrega ao editar)
npm start:quick    # Inicia sem deploy (mais rápido)
```

## Estrutura do Projeto

```
src/
├── core/index.js       ← Arquivo principal do bot
├── commands/           ← Todos os comandos (estruturados por tipo)
│   ├── polls/          ← Comandos de enquetes
│   ├── users/          ← Comandos de usuários
│   └── admin/          ← Comandos administrativos
└── utils/              ← Código compartilhado (sem dependência circular)

tests/
├── unit/               ← Testes unitários (espelhando src/)
└── integration/        ← Testes de integração

data/environments/
├── prod/               ← Dados de produção
└── staging/            ← Dados de teste/staging

docs/
├── development/        ← Documentação de desenvolvimento
└── technical/          ← Documentação técnica
```

## Comandos Úteis

```bash
# Desenvolvimento
npm start              # Iniciar bot (com deploy de comandos)
npm run dev            # Iniciar em watch mode
npm start:quick        # Iniciar sem deploy (rápido)

# Testes
npm test               # Rodar todos os testes
npm run test:watch     # Watch mode (rerun on change)
npm run test:coverage  # Com relatório de cobertura

# Linting & Formatação
npm run lint           # Check ESLint
npm run format         # Auto-format com Prettier
npm run format:check   # Verificar o que seria formatado

# CI/CD Local
npm run test:ci        # Simular execução CI/CD
```

## Troubleshooting

### ❌ "TOKEN não está definido no .env"

**Solução:** Verifique se o arquivo `.env` existe e contém `TOKEN=...`

```bash
cat .env | grep TOKEN  # Deve mostrar TOKEN=seu_token
```

### ❌ "Tests failing"

Tente:

```bash
npm cache clean --force
rm -rf node_modules
npm install
npm test
```

### ❌ Discord API "401 Unauthorized"

O token expirou ou está inválido. Gere um novo:

1. https://discord.com/developers/applications
2. Vá em "Bot" → "Token" → "Regenerate"
3. Atualize seu `.env`

### ❌ "EADDRINUSE: address already in use :::8000"

A porta 8000 está sendo usada. Mude em `.env`:

```env
PORT=8001  # ou outro número disponível
```

### ❌ "Cannot find module 'discord.js'"

Você pulou o `npm install`. Execute:

```bash
npm install
```

## Próximos Passos

1. ✅ Leia [GIT-WORKFLOW.md](GIT-WORKFLOW.md) para saber como contribuir
2. ✅ Leia [ARCHITECTURE.md](ARCHITECTURE.md) para entender estrutura
3. ✅ Veja [../CONTRIBUTING.md](../CONTRIBUTING.md) para diretrizes completas
4. ✅ Explore a pasta `tests/` para entender como testar

---

**Pronto para começar?** 🚀 Vá para [GIT-WORKFLOW.md](GIT-WORKFLOW.md) e crie sua primeira feature!
