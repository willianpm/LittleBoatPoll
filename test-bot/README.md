# 🧪 Test Bot - Diretório Isolado para Testes Automatizados

Estrutura dedicada para sistema de testes automatizados do LittleBoatPoll.

## 📁 Estrutura

```
test-bot/
├── .env.test                 # Variáveis de ambiente (use git-secret para produção)
├── .env.test.example         # Exemplo com valores padrão
├── run-full-tests.js         # Orquestrador principal
├── run-full-tests.bat        # Wrapper para Windows
├── run-full-tests.sh         # Wrapper para Linux/Mac
├── test-runner.js            # Sistema de testes automatizados
├── AUTOMATION.md             # Documentação completa
└── README.md                 # Visão geral rápida
```

## 🚀 Início Rápido

### 1. Configuração

```bash
# Copiar arquivo de exemplo
cp test-bot/.env.test.example test-bot/.env.test

# Editar com suas credenciais Discord
# TEST_BOT_TOKEN, STAGING_BOT_ID, TEST_CHANNEL_ID, TEST_GUILD_ID
```

### 2. Executar Testes

```bash
# Opção 1: Via npm (recomendado)
npm run test:full

# Opção 2: Direto pelo script
node test-bot/run-full-tests.js

# Opção 3: Windows
test-bot/run-full-tests.bat

# Opção 4: Linux/Mac
bash test-bot/run-full-tests.sh
```

## 📋 Responsabilidades

- **Arquivos `.env*`**: Configurações sensíveis (tokens, IDs)
- **`run-full-tests.*`**: Orquestração dos testes (iniciar bot, aguardar, executar)
- **`test-runner.js`**: Cenários de teste e validações

## 🔐 Segurança

⚠️ **Nunca commitar** `test-bot/.env.test` com credenciais reais

**Soluções:**

1. Adicione à `.gitignore` (já feito)
2. Use `git-secret` para credenciais em CI/CD
3. Use variáveis de ambiente do GitHub Actions

## 🔄 Integração CI/CD

Para integrar com GitHub Actions, use secrets:

```yaml
env:
  TEST_BOT_TOKEN: ${{ secrets.TEST_BOT_TOKEN }}
  STAGING_BOT_ID: ${{ secrets.STAGING_BOT_ID }}
  TEST_CHANNEL_ID: ${{ secrets.TEST_CHANNEL_ID }}
  TEST_GUILD_ID: ${{ secrets.TEST_GUILD_ID }}
```

## 📚 Documentação

Para detalhes completos sobre testes, cenários e troubleshooting:
👉 [test-bot/AUTOMATION.md](AUTOMATION.md)

---

**Separação de responsabilidades: Testes isolados do código principal** ✅
