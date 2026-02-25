# 📚 LittleBoatPoll - Bot Discord para Clube do Livro

Bot Discord completo para gerenciar votações de um Clube do Livro com sistema de peso de votos para membros VIP.

---

## 🎯 Funcionalidades Principais

### 1. **Comando `/enquete`**

Cria uma nova enquete para votação com as seguintes opções:

- 📖 **Livro**: Nome do livro
- ✍️ **Autor**: Autor do livro
- 📄 **Páginas**: Número de páginas

**Uso:**

```
/enquete livro:"1984" autor:"George Orwell" paginas:328
```

**✨ Novo:** A mensagem inclui um **botão 🛑 "Encerrar Votação"** integrado para fechar a votação com um clique!

---

### 2. **Botão de Encerramento (NOVO!)**

Cada enquete agora possui um **botão 🛑 vermelho de encerramento** integrado na mensagem.

**Como usar:**

- Clique no botão **🛑 Encerrar Votação** após os membros votarem
- O resultado aparece instantaneamente
- Não é necessário copiar ID da mensagem!

**Vantagens:**

- ✅ Interface integrada (sem copiar IDs)
- ✅ Um clique para encerrar
- ✅ 0% chance de erro
- ✅ Resultado imediato e formatado

---

### 3. **Comando `/iniciar`**

Inicia o período de votação para uma enquete existente.

**Uso:**

```
/iniciar mensagem_id:1234567890123456789
```

---

### 4. **Comando `/encerrar`**

Finaliza a votação, calcula votos com pesos e anuncia o resultado (método alternativo ao botão).

**🏆 Lógica de Cálculo:**

- **Membros VIP (Mensalistas)**: Cada voto = **peso 2**
- **Usuários Comuns**: Cada voto = **peso 1**

**Uso:**

```
/encerrar mensagem_id:1234567890123456789
```

**Exemplo de Resultado:**

```
Votos SIM: 15 pontos (7 usuários comuns + 1 VIP)
Votos NÃO: 8 pontos (4 usuários comuns + 0 VIP)
✅ LIVRO APROVADO!
```

---

### 5. **Comando `/mensalista`**

Gerencia a lista de membros VIP que recebem peso dobrado nos votos.

#### Adicionar Mensalista:

```
/mensalista adicionar usuario:@usuario_name
```

#### Remover Mensalista:

```
/mensalista remover usuario:@usuario_name
```

#### Listar Mensalistas:

```
/mensalista listar
```

---

## ⚙️ Configuração Inicial

### 1. **Criar um Bot no Discord Developer Portal**

1. Acesse: https://discord.com/developers/applications
2. Clique em **New Application**
3. Dê um nome: "LittleBoatPoll"
4. Acesse a aba **Bot** e clique em **Add Bot**
5. Copie o **TOKEN** (nunca compartilhe!)

### 2. **Configurar Permissões (Intents)**

Na aba **Bot**, habilite os seguintes **Privileged Gateway Intents**:

- ✅ **Message Content Intent** - Permite ler o conteúdo das mensagens
- ✅ **Server Members Intent** - Para gerenciar membros (opcional)

E as seguintes permissões gerais:

- ✅ Send Messages
- ✅ Embed Links
- ✅ Read Message History
- ✅ Add Reactions
- ✅ Read Reactions

### 3. **Criar o Arquivo `.env`**

Crie um arquivo `.env` na raiz do projeto:

```env
TOKEN=seu_token_do_bot_aqui
CLIENT_ID=seu_client_id_aqui
GUILD_ID=seu_guild_id_aqui
```

**Como obter o CLIENT_ID:**

- Está na aba **General Information** do Developer Portal

**Como obter o GUILD_ID:**

1. Abra Discord e habilite Modo de Desenvolvedor (User Settings > Advanced > Developer Mode)
2. Clique direito no seu servidor e copie o ID

### 4. **Instalar Dependências**

```bash
npm install
```

### 5. **Registrar Comandos Slash**

Execute este comando **apenas uma vez** (ou quando adicionar novos comandos):

```bash
node deploy-commands.js
```

Você verá:

```
🔄 Registrando comandos slash no Discord...

✅ 4 comando(s) registrado(s) com sucesso!

📋 Comandos disponíveis:
  • /enquete - Cria uma enquete para votação do Clube do Livro
  • /iniciar - Inicia o período de votação da enquete
  • /encerrar - Encerra a votação e anuncia o resultado final
  • /mensalista - Gerencia a lista de membros VIP do Clube do Livro
```

### 6. **Iniciar o Bot**

```bash
node index.js
```

Você verá:

```
✅ LittleBoatPoll está ONLINE como LittleBoatPoll#1234!
📊 Gerenciador de Clube do Livro iniciado
```

---

## 📁 Estrutura de Arquivos

```
LittleBoatPoll/
├── index.js                 # Arquivo principal (cliente Discord)
├── deploy-commands.js       # Script para registrar comandos
├── .env                     # Variáveis de ambiente (TOKEN, etc)
├── package.json             # Dependências do projeto
├── vips.json                # Lista de membros VIP (persistência)
├── votos.json               # Dados de votações ativas
└── commands/
    ├── poll.js              # Comando: /enquete
    ├── iniciar.js           # Comando: /iniciar
    ├── encerrar.js          # Comando: /encerrar
    └── mensalista.js        # Comando: /mensalista
```

---

## 🔐 Sistema de Persistência

### `vips.json`

Armazena IDs dos membros VIP:

```json
{
  "vips": ["123456789", "987654321"]
}
```

### `votos.json`

Gerencia votações ativas em memória (limpa ao reiniciar o bot)

### `historico-votacoes.json` (Criado automaticamente)

Mantém registro de todas as votações finalizadas:

```json
[
  {
    "livro": "1984",
    "autor": "George Orwell",
    "paginas": 328,
    "votosPositivos": 15,
    "votosNegativos": 8,
    "resultado": "✅ LIVRO APROVADO!",
    "participantes": 8,
    "dataCriacao": "2026-02-25T...",
    "dataFinalizacao": "2026-02-25T..."
  }
]
```

---

## 🎨 Intents do Discord (Permissões para Leitura/Escrita)

No arquivo `index.js`, configuramos os **Intents** necessários:

```javascript
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Ler informações do servidor
    GatewayIntentBits.GuildMessages, // Ler mensagens do servidor
    GatewayIntentBits.MessageContent, // Ler conteúdo das mensagens
    GatewayIntentBits.DirectMessages, // Aceitar DMs
    GatewayIntentBits.GuildMessageReactions, // ⭐ CRUCIAL: Ler reações!
  ],
});
```

**Por que `GatewayIntentBits.GuildMessageReactions` é importante?**

- Permite que o bot escute eventos de reações (👍, 👎)
- Sem isso, o bot não conseguiria contar os votos!

---

## 🚀 Como Usar (Passo a Passo)

### 1️⃣ Criar uma Enquete

```
/enquete livro:"O Hobby" autor:"J.R.R. Tolkien" paginas:424
```

O bot enviarão uma mensagem com reações 👍 e 👎

### 2️⃣ Iniciar a Votação (Opcional)

```
/iniciar mensagem_id:1234567890
```

ID da mensagem: Clique direito na mensagem → Copiar ID

### 3️⃣ Membros Votam

Os membros clicam nas reações para votar:

- 👍 = Sim, quero ler este livro
- 👎 = Não, não quero ler

### 4️⃣ Adicionar Mensalistas (VIPs)

```
/mensalista adicionar usuario:@nome_usuario
```

### 5️⃣ Encerrar Votação e Ver Resultado

```
/encerrar mensagem_id:1234567890
```

O bot exibirá:

- Total de votos (com pesos)
- Voto dos membros VIP (contando como 2)
- Voto dos usuários comuns (contando como 1)
- Resultado final (Aprovado/Rejeitado/Empate)

---

## 🔧 Troubleshooting

### O bot não responde aos comandos

**Solução:**

1. Verifique se o TOKEN no `.env` está correto
2. Execute `node deploy-commands.js` novamente
3. Reinicie o bot: `node index.js`

### Comandos não aparecem no Discord

**Solução:**

- Verifique se executou `node deploy-commands.js`
- Confirme se o CLIENT_ID no `.env` está correto
- Aguarde 1-2 minutos para o Discord sincronizar

### Bot não lê as reações

**Solução:**

- Verifique se `GatewayIntentBits.GuildMessageReactions` está habilitado em `index.js`
- Na aba **Bot** do Developer Portal, habilite **Message Content Intent**

### Erro: "Cannot read property 'vips' of undefined"

**Solução:**

- Verifique se `vips.json` existe e tem conteúdo válido
- Se não existe, execute: `node index.js` para criar automaticamente

---

## 📝 Variáveis de Ambiente (.env)

```env
# Token do Bot (NUNCA compartilhe!)
TOKEN=seu_token_aqui

# Client ID (encontre no Developer Portal)
CLIENT_ID=seu_client_id_aqui

# Guild ID (ID do seu servidor)
GUILD_ID=seu_guild_id_aqui
```

---

## 🤝 Contribuições

Para adicionar novos comandos:

1. Crie um novo arquivo em `commands/seu-comando.js`
2. Siga o padrão dos comandos existentes
3. Execute `node deploy-commands.js` para registrar
4. Reinicie o bot

---

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente.

---

## 📞 Suporte

Para dúvidas ou problemas:

- Acesse: https://discord.js.org (Documentação)
- Discord Developer Portal: https://discord.com/developers

---

**Desenvolvido com ❤️ para Clubes do Livro**
