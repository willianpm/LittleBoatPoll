# 🛠️ Comandos Úteis - LittleBoatPoll

Referência rápida de comandos para gerenciar o bot

---

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Ou com Yarn
yarn install
```

---

## 🚀 Iniciar o Bot

### Método 1: NPM Scripts (Recomendado)

```bash
# Iniciar o bot
npm start

# Ou modo dev (mesmo que start)
npm run dev

# Registrar comandos E iniciar bot
npm test
```

### Método 2: Node Direto

```bash
# Iniciar o bot
node index.js

# Registrar comandos
node deploy-commands.js
```

---

## 🔄 Fluxo Completo de Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env
cp .env.example .env
# Edite .env com seus valores

# 3. Registrar comandos no Discord
npm run deploy

# 4. Iniciar o bot
npm start
```

---

## 🔧 Comandos de Manutenção

### Atualizar Comandos

Sempre que modificar/adicionar comandos em `commands/`:

```bash
npm run deploy
```

### Reiniciar o Bot

```bash
# Parar: Ctrl+C no terminal
# Iniciar novamente:
npm start
```

### Verificar Versão das Dependências

```bash
npm list discord.js
npm list dotenv
```

### Atualizar Dependências

```bash
# Atualizar para versões compatíveis
npm update

# Atualizar para versões mais recentes
npm install discord.js@latest
```

---

## 📊 Gerenciamento de Dados

### Backup de Dados VIP

```bash
# Windows
copy vips.json vips.json.backup

# Linux/Mac
cp vips.json vips.json.backup
```

### Backup de Histórico

```bash
# Windows
copy historico-votacoes.json historico-votacoes.json.backup

# Linux/Mac
cp historico-votacoes.json historico-votacoes.json.backup
```

### Resetar Dados (CUIDADO!)

```bash
# Resetar VIPs
echo {"vips":[]} > vips.json

# Resetar histórico
del historico-votacoes.json  # Windows
rm historico-votacoes.json   # Linux/Mac
```

---

## 🐛 Debug e Logs

### Executar com Logs Detalhados

```bash
# Windows
set DEBUG=* && npm start

# Linux/Mac
DEBUG=* npm start
```

### Redirecionar Logs para Arquivo

```bash
# Windows
npm start > logs.txt 2>&1

# Linux/Mac
npm start > logs.txt 2>&1
```

### Ver Últimas Linhas do Log

```bash
# Windows (PowerShell)
Get-Content logs.txt -Tail 50

# Linux/Mac
tail -f logs.txt
```

---

## 🔐 Segurança

### Verificar se .env está no .gitignore

```bash
# Verificar
cat .gitignore | grep .env

# Adicionar se não estiver
echo ".env" >> .gitignore
```

### Regenerar Token (se exposto)

1. Acesse Discord Developer Portal
2. Vá em Bot → Token → Regenerate
3. Copie o novo token
4. Atualize `.env`
5. Reinicie o bot

---

## 📈 Produção

### Usar PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar bot com PM2
pm2 start index.js --name "LittleBoatPoll"

# Ver status
pm2 status

# Ver logs
pm2 logs LittleBoatPoll

# Parar
pm2 stop LittleBoatPoll

# Reiniciar
pm2 restart LittleBoatPoll

# Auto-restart ao reiniciar servidor
pm2 startup
pm2 save
```

### Usar Screen (Linux)

```bash
# Criar sessão screen
screen -S littleboat

# Dentro do screen:
npm start

# Desanexar: Ctrl+A, depois D
# Reanexar: screen -r littleboat
```

### Usar Systemd (Linux)

Crie arquivo `/etc/systemd/system/littleboat.service`:

```ini
[Unit]
Description=LittleBoatPoll Discord Bot
After=network.target

[Service]
Type=simple
User=seu_usuario
WorkingDirectory=/caminho/para/LittleBoatPoll
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Gerenciar serviço:

```bash
# Iniciar
sudo systemctl start littleboat

# Parar
sudo systemctl stop littleboat

# Reiniciar
sudo systemctl restart littleboat

# Status
sudo systemctl status littleboat

# Habilitar auto-start
sudo systemctl enable littleboat

# Ver logs
journalctl -u littleboat -f
```

---

## 🔄 Git

### Inicializar Repositório

```bash
git init
git add .
git commit -m "Initial commit: LittleBoatPoll bot"
```

### Criar .gitignore

O arquivo `.gitignore` já existe, mas verifique:

```bash
cat .gitignore
```

Deve conter pelo menos:

```
node_modules/
.env
*.log
```

### Fazer Commit de Mudanças

```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

---

## 📦 Scripts Personalizados (package.json)

Os seguintes scripts estão disponíveis:

```bash
npm start         # Inicia o bot
npm run deploy    # Registra comandos no Discord
npm run dev       # Modo desenvolvimento (igual a start)
npm test          # Registra comandos E inicia bot
```

---

## 🧪 Testes Rápidos

### Testar Comando Específico

Edite temporariamente `index.js` e adicione:

```javascript
// Após client.once('clientReady'):
client.on('messageCreate', (message) => {
  if (message.content === '!ping') {
    message.reply('Pong! Bot está funcionando!');
  }
});
```

No Discord, digite: `!ping`

### Verificar Intents

```javascript
// Adicione em index.js após client.once('clientReady'):
console.log('Intents habilitados:', client.options.intents);
```

---

## 🌐 Deploy em Cloud

### Heroku

```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Criar app
heroku create nome-do-bot

# Configurar variáveis de ambiente
heroku config:set TOKEN=seu_token
heroku config:set CLIENT_ID=seu_client_id

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

### Replit

1. Fork o projeto no Replit
2. Configure secrets (TOKEN, CLIENT_ID)
3. Clique em "Run"
4. Use UptimeRobot para manter online

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Iniciar projeto
railway init

# Adicionar variáveis
railway variables set TOKEN=seu_token

# Deploy
railway up
```

---

## 📊 Monitoramento

### Ver Uso de Memória

```bash
# Durante execução, use:
node --expose-gc index.js
```

### Verificar Porta e Processos

```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

---

## 🆘 Troubleshooting

### Bot não inicia

```bash
# Verificar sintaxe
node --check index.js

# Executar com stack trace completo
node --trace-warnings index.js
```

### Comandos não registram

```bash
# Limpar cache do require
rm -rf node_modules/.cache

# Reinstalar
npm install
npm run deploy
```

### Erro de permissão

```bash
# Linux/Mac
chmod +x index.js
chmod +x deploy-commands.js
```

---

## 📚 Recursos Úteis

### Discord.js

- Documentação: https://discord.js.org
- Guia: https://discordjs.guide
- GitHub: https://github.com/discordjs/discord.js

### Node.js

- Documentação: https://nodejs.org/docs
- NPM: https://npmjs.com

### Discord

- Developer Portal: https://discord.com/developers/applications
- API Docs: https://discord.com/developers/docs

---

## ✨ Comandos Rápidos (Resumo)

```bash
# Setup inicial
npm install && npm run deploy && npm start

# Atualizar comandos
npm run deploy

# Iniciar bot
npm start

# Backup de dados
cp vips.json vips.backup.json

# Ver logs em tempo real
npm start | tee logs.txt
```

---

**Dica:** Adicione esses comandos favoritos ao seu terminal!
