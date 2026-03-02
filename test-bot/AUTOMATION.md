# Teste Automatizado - LittleBoatPoll

Sistema de testes automatizados que simula interações de usuários com o bot staging, validando funcionalidades e gerando relatórios.

## 📋 Visão Geral

O sistema de testes utiliza um **bot de teste** separado que:

- ✅ Simula ações de usuários reais (votar, reagir, interagir)
- ✅ Valida comportamentos do bot staging automaticamente
- ✅ Gera relatórios detalhados de sucesso/falha
- ✅ Pode ser executado em CI/CD pipelines

## 🚀 Configuração

### 1. Criar Bot de Teste no Discord

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação: "LittleBoatPoll-Test-Bot"
3. Na seção **Bot**:
   - Crie o bot
   - Copie o **Token** (você vai precisar)
   - Ative os **Privileged Gateway Intents**:
     - ✅ Server Members Intent
     - ✅ Message Content Intent

### 2. Convidar Bot de Teste para o Servidor

Use este formato de URL (substitua `YOUR_TEST_BOT_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_TEST_BOT_CLIENT_ID&permissions=274878286912&scope=bot
```

**Permissões necessárias:**

- View Channels
- Send Messages
- Read Message History
- Add Reactions
- Use Slash Commands

### 3. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp test-bot/.env.test.example test-bot/.env.test

# Edite test-bot/.env.test com suas configurações
```

**Obter os IDs necessários:**

1. **TEST_BOT_TOKEN**: Token copiado do Developer Portal
2. **STAGING_BOT_ID**: ID do bot staging (clique direito no bot > Copiar ID)
3. **TEST_CHANNEL_ID**: ID do canal de testes (clique direito no canal > Copiar ID)
4. **TEST_GUILD_ID**: ID do servidor (clique direito no servidor > Copiar ID)

> 💡 **Dica**: Ative o "Modo Desenvolvedor" no Discord (Configurações > Avançado) para ver a opção "Copiar ID"

### 4. Instalar Dependências

```bash
npm install
```

## 🎯 Executar Testes

### Teste Completo (Recomendado)

O script inicia o bot staging, aguarda estar online, executa os testes e para o bot automaticamente:

```bash
npm run test:full
```

### Apenas o Test Runner

Certifique-se de que o bot staging esteja online em outro terminal:

```bash
# Terminal 1: Inicie o bot staging
npm run start:staging

# Terminal 2: Execute os testes
npm run test:automation
```

## 📊 Cenários de Teste

### 1. 📋 Criar Enquete Básica

- ✓ Verifica se bot staging está no servidor
- ✓ Verifica se bot está respondendo
- ✓ Valida disponibilidade do comando `/enquete`

### 2. 🗳️ Votar em Enquete

- ✓ Encontra enquete ativa no canal
- ✓ Adiciona reações automaticamente (se não existirem)
- ✓ Valida que o voto foi registrado
- ✓ Remove voto e valida remoção

### 3. 🚫 Limites de Votação

- ✓ Identifica limite máximo de votos
- ✓ Tenta votar além do limite
- ✓ Valida remoção automática de votos extras
- ✓ Confirma que apenas votos válidos permanecem

### 4. 🔒 Sistema de Permissões

- ✓ Verifica permissões de envio de mensagens
- ✓ Verifica permissões de gerenciamento de reações
- ✓ Valida disponibilidade dos comandos

## 📈 Relatório de Testes

O sistema gera um relatório completo no console:

```
╔══════════════════════════════════════════════╗
║   🧪 LittleBoatPoll - Testes Automatizados   ║
╚══════════════════════════════════════════════╝

✓ Bot de teste conectado: LittleBoatPoll-Staging#8670
✓ Canal de testes: #geral

==================================================

📋 Cenário 1: Criar Enquete Básica
  ✓ Bot staging encontrado
  ✓ Bot staging responde no canal
  ✓ Bot de teste pode usar slash commands

🗳️  Cenário 2: Votar em Enquete
  ✓ Mensagem do bot encontrada
  ✓ Enquete tem opções (reações)
  ✓ Bot de teste conseguiu reagir
  ✓ Voto registrado corretamente
  ✓ Remoção de voto funciona

🚫 Cenário 3: Limites de Votação
  ✓ Mensagem do bot encontrada
  ✓ Enquete com múltiplas opções
  ✓ Adicionados 3 votos
  ✓ Votos foram processados

🔒 Cenário 4: Sistema de Permissões
  ✓ Bot tem permissão para enviar mensagens
  ✓ Bot tem permissão para gerenciar reações

==================================================

📊 RELATÓRIO FINAL
==================================================

Total de testes: 14
✓ Passou: 14
✗ Falhou: 0

Taxa de sucesso: 100.0%

==================================================
```

## 🔧 Troubleshooting

### Bot de teste não conecta

**Erro**: `❌ Erro ao conectar bot de teste: Invalid token`

**Solução**: Verifique o `TEST_BOT_TOKEN` em `test-bot/.env.test`

---

### Canal não encontrado

**Erro**: `❌ Canal de testes não encontrado`

**Solução**:

- Certifique-se de que o bot de teste está no servidor
- Verifique o `TEST_CHANNEL_ID` em `test-bot/.env.test`
- Confirme que o bot tem permissão para ver o canal

---

### Nenhuma enquete encontrada

**Erro**: `Crie uma enquete manualmente com /enquete primeiro`

**Solução**:

1. Inicie o bot staging: `npm run start:staging`
2. No canal de testes, execute: `/enquete`
3. Execute os testes novamente

---

### Testes falhando em "Limites de Votação"

**Solução**:

- Verifique se o bot staging tem permissão **Manage Messages**
- Confirme que a função `enforceVoteLimits()` está funcionando
- Tente criar uma nova enquete com limite de 1 voto

## 🔄 Integração CI/CD

### GitHub Actions (exemplo)

```yaml
name: Test Staging Bot

on:
  push:
    branches: [develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run full test suite
        run: npm run test:full
        env:
          TEST_BOT_TOKEN: ${{ secrets.TEST_BOT_TOKEN }}
          STAGING_BOT_ID: ${{ secrets.STAGING_BOT_ID }}
          TEST_CHANNEL_ID: ${{ secrets.TEST_CHANNEL_ID }}
          TEST_GUILD_ID: ${{ secrets.TEST_GUILD_ID }}
```

## 📝 Adicionar Novos Testes

Para adicionar um novo cenário de teste, edite [test-bot/test-runner.js](test-runner.js):

```javascript
async function testMyCenario(channel) {
  log('\n🔥 Cenário X: Meu Novo Teste', 'cyan');

  try {
    // Sua lógica de teste aqui
    const resultado = await minhaFuncao();

    recordTest('Meu Novo Teste', 'Descrição do teste', resultado === esperado);
  } catch (error) {
    recordTest('Meu Novo Teste', 'Execução sem erros', false, error.message);
  }
}
```

Adicione a chamada na função `ready`:

```javascript
await testMyCenario(channel);
```

## 🎓 Boas Práticas

1. **Sempre limpe após os testes**: Remova reações, mensagens de teste, etc.
2. **Use `wait()` entre ações**: Evita rate limits do Discord
3. **Valide precondições**: Verifique que enquetes existem antes de testar votos
4. **Registre detalhes em falhas**: Use o parâmetro `details` de `recordTest()`
5. **Use canal dedicado**: Não execute testes em canais de produção

## 📚 Recursos

- [Discord.js Documentation](https://discord.js.org/)
- [Discord API Rate Limits](https://discord.com/developers/docs/topics/rate-limits)
- [Jest Testing Framework](https://jestjs.io/) (para testes unitários)

## 🤝 Contribuindo

Para adicionar novos testes automatizados:

1. Crie o cenário de teste em [test-bot/test-runner.js](test-runner.js)
2. Teste localmente: `npm run test:full`
3. Atualize esta documentação (se necessário)
4. Envie um Pull Request

---

**© 2026 LittleBoatPoll - Sistema de Testes Automatizados**
