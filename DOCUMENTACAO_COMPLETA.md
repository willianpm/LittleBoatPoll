# 📚 LITTLEBOATPOLL - DOCUMENTAÇÃO COMPLETA

Bot Discord para Clube do Livro com Sistema de Votação Ponderada

---

## 📑 ÍNDICE

- [1. Introdução](#1-introdução)
- [2. Guia Rápido (5 Minutos)](#2-guia-rápido-5-minutos)
- [3. Setup Inicial](#3-setup-inicial)
- [4. Funcionalidades](#4-funcionalidades)
- [5. Comandos Detalhados](#5-comandos-detalhados)
- [6. Arquitetura Técnica](#6-arquitetura-técnica)
- [7. Sistema de Pesos de Votos](#7-sistema-de-pesos-de-votos)
- [8. Persistência de Dados](#8-persistência-de-dados)
- [9. Segurança e Permissões](#9-segurança-e-permissões)
- [10. Botão de Encerramento](#10-botão-de-encerramento)
- [11. Comandos Úteis](#11-comandos-úteis)
- [12. Troubleshooting](#12-troubleshooting)
- [13. Desenvolvimento e Personalizações](#13-desenvolvimento-e-personalizações)
- [14. Referências](#14-referências)

---

# 1. INTRODUÇÃO

## 📖 O Que é LittleBoatPoll?

LittleBoatPoll é um **bot Discord completo e profissional** para gerenciar votações em um Clube do Livro com as seguintes características:

### ✨ Características Principais

- 📊 **Sistema de Votação com Pesos** - Membros VIP têm votos com peso 2, membros comuns têm peso 1
- 🎯 **4 Comandos Slash** - /enquete, /iniciar, /encerrar, /mensalista
- 🛑 **Botão de Encerramento** - Clique um botão em vez de copiar IDs
- 💾 **Persistência de Dados** - VIPs e histórico salvos em arquivos JSON
- 🔐 **Proteção de Permissões** - Apenas admins podem gerenciar votações
- 📚 **Documentação Completa** - Tudo explicado em detalhes

### 🎯 Use Cases

```
├─ Clube do Livro: Votação mensal de livros
├─ Grupos: Decidir próximo tema de discussão
├─ Comunidades: Escolha democrática com peso para membros ativos
└─ Qualquer votação: Que precise de peso especial para alguns votos
```

## 📁 Estrutura de Arquivos

```
LittleBoatPoll/
├── index.js                      # Cliente Discord (núcleo)
├── deploy-commands.js            # Registra comandos no Discord
├── package.json                  # Dependências
│
├── .env                          # Variáveis de ambiente (TOKEN, CLIENT_ID)
├── .env.example                  # Template de .env
├── .gitignore                    # Arquivos ignorados pelo Git
│
├── vips.json                     # Lista de membros VIP (persistente)
├── mensalistas.json              # Alias de vips.json
├── historico-votacoes.json       # Histórico de votações (auto-criado)
├── active-polls.json             # Votações ativas (persistência)
│
├── commands/
│   ├── poll.js                   # Comando /enquete
│   ├── iniciar.js                # Comando /iniciar
│   ├── encerrar.js               # Comando /encerrar
│   └── mensalista.js             # Comando /mensalista
│
└── 📖 DOCUMENTACAO_COMPLETA.md   # Este arquivo!
```

---

# 2. GUIA RÁPIDO (5 Minutos)

Para começar **agora mesmo**, execute:

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo .env (copie .env.example)
cp .env.example .env

# 3. Editar .env com seus valores
# Obtenha TOKEN e CLIENT_ID em: https://discord.com/developers/applications

# 4. Registrar comandos
node deploy-commands.js

# 5. Iniciar bot
node index.js
```

Esperado ver:

```
✅ LittleBoatPoll está ONLINE como LittleBoatPoll#1234!
📊 Gerenciador de Clube do Livro iniciado
```

### Usar no Discord

```
# Criar enquete
/enquete livro:"1984" autor:"George Orwell" paginas:328

# Membros votam (clicam em 👍 ou 👎)

# Admin encerra (clica botão 🛑 ou usa comando)
/encerrar mensagem_id:123456789

# Ver resultado
✅ LIVRO APROVADO! Votos: 15 vs 8
```

---

# 3. SETUP INICIAL

## Pré-requisitos

- ✅ Node.js instalado (v16+)
- ✅ Servidor Discord
- ✅ Permissões de administrador no servidor

## Passo 1: Obter Token e CLIENT_ID

### No Discord Developer Portal

1. Acesse: https://discord.com/developers/applications
2. Clique "New Application"
3. Dê um nome: "LittleBoatPoll"
4. Vá em **Bot** tab → Clique **Add Bot**
5. Em **TOKEN**, clique **Copy**
6. Em **General Information**, copie **Application ID** (CLIENT_ID)

## Passo 2: Habilitar Intents

No Developer Portal, em **Bot** → **PRIVILEGED GATEWAY INTENTS**:

- ✅ **Message Content Intent** - OBRIGATÓRIO
- ✅ **Server Members Intent** - Opcional

## Passo 3: Configurar .env

Crie arquivo `.env` na raiz do projeto:

```env
TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
GUILD_ID=seu_guild_id_aqui (opcional)
```

**Como obter GUILD_ID:**

1. No Discord, ative **Developer Mode** (User Settings → Advanced)
2. Clique direito no servidor → "Copy Server ID"

## Passo 4: Instalar Dependências

```bash
npm install
```

## Passo 5: Registrar Comandos

Execute **uma única vez** (ou quando adicionar novos comandos):

```bash
node deploy-commands.js
```

Esperado:

```
🔄 Registrando comandos slash no Discord...

✅ 4 comando(s) registrado(s) com sucesso!

📋 Comandos disponíveis:
  • /enquete - Cria uma enquete para votação
  • /iniciar - Inicia o período de votação
  • /encerrar - Encerra a votação e anuncia resultado
  • /mensalista - Gerencia lista de mensalistas VIP
```

## Passo 6: Iniciar o Bot

```bash
node index.js
```

Esperado:

```
✅ LittleBoatPoll está ONLINE como LittleBoatPoll#1234!
📊 Gerenciador de Clube do Livro iniciado
```

**Pronto!** Bot está rodando. 🎉

---

# 4. FUNCIONALIDADES

## Fluxo Completo de Uma Votação

```
1️⃣ CRIAR ENQUETE
   /enquete livro:"Nome" autor:"Autor" paginas:123

2️⃣ MEMBROS VOTAM
   Clicam em 👍 (SIM) ou 👎 (NÃO)

3️⃣ ADMIN ENCERRA
   Clica botão 🛑 OU usa /encerrar mensagem_id:...

4️⃣ RESULTADO APARECE
   ✅ APROVADO / ❌ REJEITADO / 🤝 EMPATE
   Com cálculo de pesos (VIP=2, Comum=1)
```

## Funcionalidades Principais

### ✅ Votação com Reações

```
Mensagem da enquete inclui:
├─ Informações (livro, autor, páginas)
├─ Reações 👍 e 👎 para votar
└─ Botão 🛑 de encerramento
```

### ✅ Sistema de Peso de Votos

```
Membro Comum:   1 voto = 1 ponto
Membro VIP:     1 voto = 2 pontos (dobrado!)
```

### ✅ Persistência de VIPs

```
vips.json salva:
- IDs dos membros VIP
- Persiste entre reinicializações
```

### ✅ Histórico de Votações

```
historico-votacoes.json armazena:
- Título da votação
- Resultado final
- Data e hora
- Número de participantes
```

### ✅ Proteção de Permissões

```
✅ Apenas admins podem:
- Clicar botão 🛑
- Usar /encerrar
- Gerenciar /mensalista adicionar/remover
```

---

# 5. COMANDOS DETALHADOS

## 5.1 Comando: `/enquete`

Cria uma nova enquete para votação.

### Sintaxe

```
/enquete livro:"Nome do Livro" autor:"Nome do Autor" paginas:NÚMERO
```

### Exemplo

```
/enquete livro:"1984" autor:"George Orwell" paginas:328
```

### O que Acontece

1. Bot cria Embed formatado com:
   - Título da enquete
   - Informações do livro (nome, autor, páginas)
   - Reações 👍 e 👎
   - Botão 🛑 "Encerrar Votação" (apenas para admins)

2. Enquete é armazenada em `client.activePolls`

3. Votação está pronta para receber reações

### Exemplo de Resposta

```
📚 NOVA ENQUETE - CLUBE DO LIVRO 📚

Vote abaixo se deseja ler esse livro no próximo mês!

📖 Livro: 1984
✍️ Autor: George Orwell
📄 Páginas: 328

[👍] [👎] [🛑 Encerrar Votação]
```

### Permissões

- Qualquer membro pode criar (pode ser restringido a admins editando `commands/poll.js`)

---

## 5.2 Comando: `/iniciar`

Marca uma enquete como ativa (opcional).

### Sintaxe

```
/iniciar mensagem_id:ID_DA_MENSAGEM
```

### Como Obter Mensagem ID

1. Clique direito na mensagem da enquete
2. Selecione "Copy Message ID"
3. Cole no comando

### Exemplo

```
/iniciar mensagem_id:1234567890123456789
```

### O que Faz

- Marca enquete com `status: 'ativa'`
- Pode ser omitido (implementação futura)

---

## 5.3 Comando: `/encerrar`

Finaliza a votação, calcula pesos e anuncia resultado.

### Sintaxe

```
/encerrar mensagem_id:ID_DA_MENSAGEM
```

### Duas Formas de Usar

#### Opção 1: Botão (Recomendado) ✨

Clique no botão 🛑 "Encerrar Votação" na mensagem da enquete.

**Vantagens:**

- ✅ 1 clique
- ✅ Sem copiar ID
- ✅ Interface integrada

#### Opção 2: Comando

```
/encerrar mensagem_id:1234567890123456789
```

### Permissões

- ⛔ Apenas administradores
- Mensagem de erro se não autorizado

### O que Acontece

1. Bot busca enquete em `client.activePolls`
2. Itera sobre todos os votos registrados
3. **Calcula com pesos:**
   - VIP = peso 2
   - Comum = peso 1
4. Soma votos:
   - SIM: soma de todos os pesos em 👍
   - NÃO: soma de todos os pesos em 👎
5. Determina resultado:
   - Se SIM > NÃO: ✅ APROVADO
   - Se NÃO > SIM: ❌ REJEITADO
   - Se SIM = NÃO: 🤝 EMPATE
6. Salva em `historico-votacoes.json`
7. Exibe Embed com resultado

### Exemplo de Resultado

```
📊 RESULTADO FINAL DA VOTAÇÃO 📊

📖 Livro: 1984
✍️ Autor: George Orwell
📄 Páginas: 328

👍 Votos SIM: 15 pontos (1 VIP @ peso 2 + 6 comuns @ peso 1 + 1 mais = 15)
👎 Votos NÃO: 8 pontos (0 VIPs + 8 comuns @ peso 1 = 8)

🏆 RESULTADO: ✅ LIVRO APROVADO!

Total de participantes: 14
Membros VIP contam como peso 2
```

---

## 5.4 Comando: `/mensalista`

Gerencia a lista de membros VIP (mensalistas).

### Subcomando: Adicionar

```
/mensalista adicionar usuario:@usuario_name
```

- Adiciona usuário à lista de VIPs
- Seus votos contarão como peso 2
- Apenas admins podem executar

### Subcomando: Remover

```
/mensalista remover usuario:@usuario_name
```

- Remove usuário da lista de VIPs
- Seus votos futuros contarão como peso 1
- Apenas admins podem executar

### Subcomando: Listar

```
/mensalista listar
```

- Mostra todos os membros VIP cadastrados
- **Qualquer um pode usar** (informação pública)

### Exemplo

```
/mensalista adicionar usuario:@presidente
/mensalista adicionar usuario:@vice-presidente
/mensalista listar
```

Resultado:

```
👑 MEMBROS VIP (Mensalistas)

Os seguintes usuários têm voto com peso 2:

1. presidente
2. vice-presidente

Total: 2 membros VIP

Seus votos contam como peso 2! 🎖️
```

### Permissões

| Subcomando | Permissão Necessária |
| ---------- | -------------------- |
| adicionar  | Admin                |
| remover    | Admin                |
| listar     | Qualquer um          |

---

# 6. ARQUITETURA TÉCNICA

## 6.1 Visão Geral

```
┌─────────────────────────────────────────┐
│ USUÁRIOS NO DISCORD                    │
│ (Add/Remove Reações na Enquete)         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Eventos de Reação in index.js           │
│ - messageReactionAdd                    │
│ - messageReactionRemove                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ client.activePolls Map (em memória)     │
│ {                                       │
│   "messageid": {                        │
│     titulo, opcoes, votos, status       │
│   }                                     │
│ }                                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ /encerrar Command (calcula)             │
│ - Pesa votos (VIP=2, Comum=1)          │
│ - Determina vencedor                    │
│ - Salva em historico-votacoes.json      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Resultado Exibido no Discord            │
│ ✅ APROVADO / ❌ REJEITADO / 🤝 EMPATE  │
└─────────────────────────────────────────┘
```

## 6.2 Fluxo Detalhado de Uma Votação

### Fase 1: Criar Enquete

```
/enquete livro:"1984" autor:"Orwell" paginas:328
│
├─ poll.js: execute() chamado
├─ Valida permissões (admin ou cargo autorizado)
├─ Cria Embed formatado
├─ Adiciona reações 👍 👎
├─ Cria ActionRow com botão 🛑
├─ Envia mensagem
└─ Armazena em client.activePolls
```

### Fase 2: Votação em Andamento

```
Usuário clica em 👍
│
├─ Discord dispara: messageReactionAdd
├─ index.js listener ativado
├─ Busca enquete em client.activePolls
├─ Se não encontrada: sair
├─ Se encontrada:
│  ├─ Lê vips.json
│  ├─ Verifica se usuário é VIP
│  ├─ Define peso: VIP=2, Comum=1
│  ├─ Registra voto em poll.votos
│  └─ Salva em active-polls.json
└─ Aguarda mais reações ou /encerrar
```

### Fase 3: Encerrar e Calcular

```
Admin clica botão 🛑 OU /encerrar mensagem_id:...
│
├─ Busca enquete em client.activePolls
├─ Verifica permissões (apenas admin)
├─ Marca enquete: status = 'finalizada'
├─ **Calcula votos:**
│  ├─ Para cada voto em poll.votos:
│  │  ├─ Se reação === '👍': votosPositivos += peso
│  │  └─ Se reação === '👎': votosNegativos += peso
│  └─ Compara votosPositivos vs votosNegativos
├─ Cria Embed com resultado
├─ Salva em historico-votacoes.json
├─ Remove de client.activePolls
├─ Salva em active-polls.json
└─ Exibe resultado no Discord
```

## 6.3 Intents do Discord

Discord Intents são categorias de eventos que o bot pode escutar.

### Intents Habilitados (em index.js)

```javascript
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Eventos do servidor
    GatewayIntentBits.GuildMessages, // Mensagens
    GatewayIntentBits.MessageContent, // Conteúdo das mensagens
    GatewayIntentBits.DirectMessages, // DMs
    GatewayIntentBits.GuildMessageReactions, // ⭐ REAÇÕES (CRÍTICO!)
  ],
});
```

### Porquê GuildMessageReactions é Crítico?

Sem esse Intent, o bot **não consegue ler 👍 e 👎**!

- ✅ Com Intent: Bot escuta eventos de reação
- ❌ Sem Intent: Reações são ignoradas

### Habilitar no Developer Portal

1. Discord Developer Portal → Sua app
2. **Bot** tab
3. **PRIVILEGED GATEWAY INTENTS**
4. ✅ Habilite:
   - Message Content Intent
   - (Server Members Intent - opcional)

---

# 7. SISTEMA DE PESOS DE VOTOS

## 7.1 Conceito

Membros VIP (Mensalistas) têm seus votos contados com **peso 2**, enquanto membros comuns têm **peso 1**.

### Exemplo Prático

```
Votação sobre "1984"

Membros VIP:
├─ João votou 👍 → +2 pontos SIM
└─ Maria votou 👎 → +2 pontos NÃO

Membros Comuns:
├─ Pedro votou 👍 → +1 ponto SIM
├─ Ana votou 👍 → +1 ponto SIM
├─ Carlos votou 👎 → +1 ponto NÃO
└─ Laura votou 👎 → +1 ponto NÃO

RESULTADO:
SIM:  2 (João VIP) + 1 (Pedro) + 1 (Ana) = 4 pontos
NÃO:  2 (Maria VIP) + 1 (Carlos) + 1 (Laura) = 4 pontos

🤝 EMPATE!
```

## 7.2 Implementação

### Onde É Definido o Peso?

**Arquivo: `index.js` linha ~105**

```javascript
// Quando usuário reage:
let mensalistasData = { mensalistas: [] };
if (fs.existsSync('./mensalistas.json')) {
  mensalistasData = JSON.parse(fs.readFileSync('./mensalistas.json', 'utf8'));
}
const isMensalista = mensalistasData.mensalistas.includes(user.id);
const peso = isMensalista && poll.usarPesoMensalista ? 2 : 1;
```

### Quando É Calculado?

**Arquivo: `commands/encerrar.js` linha ~50**

```javascript
// Conta os votos com peso
for (const [userId, votoData] of Object.entries(poll.votos)) {
  const peso = votoData.peso;

  // Processa cada reação do usuário
  for (const emoji of votoData.reacoes) {
    const index = poll.emojiNumeros.indexOf(emoji);
    if (index !== -1) {
      resultados[index].pontos += peso;
    }
  }
}
```

## 7.3 Como Adicionar/Remover VIPs

### Adicionar

```
/mensalista adicionar usuario:@nome_usuario
```

- Usuário é adicionado a `mensalistas.json`
- Próximos votos contarão como peso 2

### Remover

```
/mensalista remover usuario:@nome_usuario
```

- Usuário é removido de `mensalistas.json`
- Próximos votos contarão como peso 1

**Nota:** Votos já registrados **não mudam** de peso retroativamente.

---

# 8. PERSISTÊNCIA DE DADOS

## 8.1 Dados que Persistem

### `mensalistas.json`

Armazena IDs de membros VIP. **Persiste entre reinicializações.**

```json
{
  "mensalistas": ["123456789", "987654321", "111222333444555666"]
}
```

**Acesso:** Atualizado via `/mensalista adicionar/remover`

### `historico-votacoes.json`

Armazena histórico de todas as votações finalizadas.

```json
[
  {
    "titulo": "1984",
    "opcoes": ["Sim", "Não"],
    "maxVotos": 1,
    "usarPesoMensalista": true,
    "resultados": [
      {
        "opcao": "Sim",
        "emoji": "🇦",
        "pontos": 15,
        "votantes": ["João", "Maria", "Pedro"]
      }
    ],
    "vencedor": "Sim",
    "participantes": 8,
    "dataCriacao": "2026-02-25T14:30:00.000Z",
    "dataFinalizacao": "2026-02-25T15:45:00.000Z"
  }
]
```

**Acesso:** Atualizado automaticamente via `/encerrar`

### `active-polls.json`

Armazena votações ativas para persistência entre reinicializações.

```json
[
  [
    "1234567890",
    {
      "messageId": "1234567890",
      "titulo": "1984",
      "opcoes": ["Sim", "Não"],
      "votos": {
        "userid123": {
          "usuario": "João",
          "peso": 2,
          "reacoes": ["🇦"]
        }
      }
    }
  ]
]
```

**Acesso:** Atualizado a cada reação em `/messageReactionAdd` e `/messageReactionRemove`

## 8.2 Dados que Se Perdem

### `client.activePolls` (Memória)

Armazenado no Map em memória durante execução.

```
ANTES (sem persistência):
├─ Bot reinicia
├─ Votações em andamento: PERDIDAS ❌
└─ Usuários precisam votar novamente

AGORA (com persistência):
├─ Bot salva em active-polls.json a cada reação
├─ Bot reinicia
├─ Votações carregadas de active-polls.json ✅
└─ Votos são restaurados
```

## 8.3 Backup de Dados

### Backup Manual

```bash
# Windows
copy mensalistas.json mensalistas.json.backup
copy historico-votacoes.json historico-votacoes.json.backup

# Linux/Mac
cp mensalistas.json mensalistas.json.backup
cp historico-votacoes.json historico-votacoes.json.backup
```

### Resetar Dados (CUIDADO!)

```bash
# Resetar VIPs
echo {"mensalistas":[]} > mensalistas.json

# Resetar histórico
rm historico-votacoes.json  # Linux/Mac
del historico-votacoes.json # Windows

# Resetar votações ativas
rm active-polls.json  # Linux/Mac
del active-polls.json # Windows
```

---

# 9. SEGURANÇA E PERMISSÕES

## 9.1 Proteção de Permissões

### Quem Pode Fazer O Quê?

| Ação               | Admin | Comum |
| ------------------ | ----- | ----- |
| Criar enquete      | ✅    | ✅    |
| Votar              | ✅    | ✅    |
| Clicar botão 🛑    | ✅    | ❌    |
| `/encerrar`        | ✅    | ❌    |
| `/mensalista add`  | ✅    | ❌    |
| `/mensalista rem`  | ✅    | ❌    |
| `/mensalista list` | ✅    | ✅    |

### Implementação

**Arquivo: `index.js` linha ~95 (botão)**

```javascript
if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
  return await interaction.reply({
    content: '❌ Permissão negada! Apenas administradores podem encerrar votações.',
    ephemeral: true,
  });
}
```

**Arquivo: `commands/encerrar.js` linha ~22 (comando)**

```javascript
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
```

**Arquivo: `commands/mensalista.js` linha ~37 (subcomandos)**

```javascript
if ((subcommand === 'adicionar' || subcommand === 'remover') && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
  // Acesso negado
}
```

## 9.2 Segurança de Dados

### Token do Bot

✅ **Protegido** em arquivo `.env` (nunca commitado)

```env
TOKEN=seu_token_aqui  # NUNCA compartilhe!
```

✅ **Adicionado a `.gitignore`**

```
.env
.env.local
.env.*.local
```

### Validação de Entrada

- ✅ IDs de mensagem validados antes de usar
- ✅ IDs de usuário validados
- ✅ Nomes de livro limitados a caracteres seguros

### Tratamento de Erros

```javascript
try {
  // Código
} catch (error) {
  console.error('❌ Erro ao...:', error);

  // Resposta ao usuário
  await interaction.reply({
    content: '❌ Erro ao executar comando!',
    ephemeral: true,
  });
}
```

## 9.3 Logs de Audit

Todos os eventos importantes são logados no console:

```
✅ Comando carregado: enquete
📝 Executando comando: /enquete - Usuário: João#1234
✅ Enquete criada: 1984 | 2 opções | ID: 1234567890
🔔 João reagiu com 🇦
✅ João votou em 🇦 (1/1)
✅ Votação finalizada: 1984 | Vencedor: ✅ APROVADO!
```

---

# 10. BOTÃO DE ENCERRAMENTO

## 10.1 Como Funciona

### Antes (Manual)

```
1. Criar enquete
2. Copiar ID da mensagem (direito → Copy Message ID)
3. Digitar comando: /encerrar mensagem_id:123456789
4. Qualquer um podia fazer isso
5. Resultado depois de alguns segundos
```

### Agora (Automático)

```
1. Criar enquete
2. Admin clica botão 🛑 "Encerrar Votação" na mensagem
3. Resultado aparece instantaneamente
4. Apenas admin pode fazer isso
5. 100% seguro
```

## 10.2 Usando o Botão

### Passo 1: Criar Enquete

```
/enquete livro:"1984" autor:"George Orwell" paginas:328
```

Bot responde:

```
📚 NOVA ENQUETE - CLUBE DO LIVRO 📚

Vote abaixo se deseja ler esse livro!

📖 Livro: 1984
✍️ Autor: George Orwell
📄 Páginas: 328

[👍] [👎] [🛑 Encerrar Votação]
```

### Passo 2: Membros Votam

Clicam em 👍 ou 👎 durante a votação.

### Passo 3: Admin Encerra

- **Se admin:** Clica no botão 🛑 → Resultado aparece
- **Se não admin:** Tenta clicar → Recebe erro ❌

```
❌ Permissão negada!
Apenas administradores podem encerrar votações.
```

## 10.3 Vantagens

| Aspecto          | Botão     | Comando    |
| ---------------- | --------- | ---------- |
| Número de passos | 1         | 3          |
| Chance de erro   | 0%        | Alta       |
| Interface        | Integrada | Fora       |
| Tempo            | Imediato  | Alguns seg |
| Segurança        | ✅        | ✅         |

---

# 11. COMANDOS ÚTEIS

## 11.1 Instalação e Setup

```bash
# Instalar dependências
npm install

# Copiar template .env
cp .env.example .env

# Registrar comandos (executar uma vez)
node deploy-commands.js

# Iniciar bot
npm start
```

## 11.2 NPM Scripts Disponíveis

Definidos em `package.json`:

```bash
npm start       # Inicia o bot
npm run deploy  # Registra comandos
npm run dev     # Modo desenvolvimento
npm test        # Registra e inicia bot
```

## 11.3 Gerenciamento de Dados

### Backup

```bash
# Windows
copy mensalistas.json mensalistas.json.backup
copy historico-votacoes.json historico-votacoes.json.backup

# Linux/Mac
cp mensalistas.json mensalistas.json.backup
cp historico-votacoes.json historico-votacoes.json.backup
```

### Verificar Dependências

```bash
npm list discord.js
npm list dotenv
npm list             # Todas as dependências
```

### Atualizar Dependências

```bash
npm update              # Versões compatíveis
npm install discord.js@latest  # Versão mais recente
```

## 11.4 Debug e Logs

### Ver Logs Detalhados

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

### Monitorar Logs em Tempo Real

```bash
# Linux/Mac
tail -f logs.txt

# Windows (PowerShell)
Get-Content logs.txt -Tail 50
```

## 11.5 Production (Deploy)

### PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar bot
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

### Screen (Linux)

```bash
# Criar sessão
screen -S littleboat

# Dentro do screen
npm start

# Desanexar: Ctrl+A, depois D
# Reanexar: screen -r littleboat
```

### Systemd (Linux)

Crie `/etc/systemd/system/littleboat.service`:

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

Gerenciar:

```bash
sudo systemctl start littleboat
sudo systemctl stop littleboat
sudo systemctl restart littleboat
sudo systemctl status littleboat
sudo systemctl enable littleboat  # Auto-start
journalctl -u littleboat -f       # Ver logs
```

---

# 12. TROUBLESHOOTING

## 12.1 Problemas Comuns

### ❌ Bot não fica online

**Sintoma:**

```
Bot não aparece como online no Discord
```

**Soluções:**

1. Verifique se TOKEN em `.env` está correto

   ```bash
   # Recopy TOKEN do Developer Portal
   # Discord Portal → Bot → Copy TOKEN
   ```

2. Verifique sintaxe de `.env`:

   ```env
   # Correto:
   TOKEN=seu_token_aqui

   # Errado:
   TOKEN="seu_token_aqui"  # Não use aspas
   ```

3. Reinicie o bot:
   ```bash
   Ctrl+C  # Para
   npm start  # Inicia
   ```

### ❌ Comandos não aparecem no Discord

**Sintoma:**

```
Digito / mas nenhum comando aparece
```

**Soluções:**

1. Registre os comandos:

   ```bash
   node deploy-commands.js
   ```

2. Verifique se CLIENT_ID em `.env` está correto

3. Aguarde 1-2 minutos para o Discord sincronizar

4. Recarregue o Discord (Ctrl+Shift+R no Windows/Mac)

### ❌ Bot lê reações

**Sintoma:**

```
Usuários clicam em 👍👎 mas não registra
```

**Soluções:**

1. Verifique se `GatewayIntentBits.GuildMessageReactions` está em `index.js`

2. No Developer Portal, habilite **Message Content Intent** em Bot → PRIVILEGED GATEWAY INTENTS

3. Preencha `.env` com CLIENT_ID correto

4. Registre comandos novamente:
   ```bash
   node deploy-commands.js
   ```

### ❌ Erro: "Cannot read property 'mensalistas' of undefined"

**Sintoma:**

```
(node:1234) Error: Cannot read property 'mensalistas' of undefined
```

**Soluções:**

1. Verifique se `mensalistas.json` existe
   - Se não existe, será criado na próxima execução
2. Reinicie o bot:
   ```bash
   Ctrl+C
   npm start
   ```

### ❌ Erro: "ENOENT: no such file or directory"

**Sintoma:**

```
Error: ENOENT: no such file or directory, open './mensalistas.json'
```

**Soluções:**

1. Os arquivos JSON são criados automaticamente.
2. Se não foram criados, execute:
   ```bash
   node index.js
   ```
3. Verifique se você tem permissão de escrita no diretório:
   ```bash
   # Linux/Mac
   chmod 755 .
   ```

### ❌ Erro: "Token invalid"

**Sintoma:**

```
Error [TOKEN_INVALID]: An invalid token was provided.
```

**Soluções:**

1. Copie o token novamente do Developer Portal
2. Sure de que **não há espaços extras** em `.env`
3. Regenere o token se exposto:
   - Discord Portal → Bot → Token → Regenerate

## 12.2 Verificações Rápidas

### Validar Sintaxe do Código

```bash
node --check index.js
node --check deploy-commands.js
```

### Ver Stack Trace Completo

```bash
node --trace-warnings index.js
```

### Verificar Permissões de Arquivo

```bash
# Linux/Mac
ls -la  # Verifique se pode ler/escrever
chmod +x index.js
chmod +x deploy-commands.js
```

### Listar Processos Node Ativos

```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

---

# 13. DESENVOLVIMENTO E PERSONALIZAÇÕES

## 13.1 Estrutura de Um Comando

Todos os comandos seguem este padrão:

```javascript
// commands/meu-comando.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meu-comando')
    .setDescription('Descrição do comando')
    .addStringOption((option) => option.setName('parametro').setDescription('Descrição do parâmetro').setRequired(true)),

  async execute(interaction, client) {
    try {
      // Sua lógica aqui

      await interaction.reply({
        content: 'Resposta do comando',
        ephemeral: true, // Privado ou falso para público
      });
    } catch (error) {
      console.error('❌ Erro:', error);

      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Erro ao executar comando!',
          ephemeral: true,
        });
      }
    }
  },
};
```

## 13.2 Adicionar Novo Comando

### Passo 1: Criar Arquivo

```bash
# Linux/Mac
touch commands/novo-comando.js

# Windows
type nul > commands\novo-comando.js
```

### Passo 2: Escrever Código

```javascript
// commands/novo-comando.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('novo').setDescription('Meu novo comando'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder().setColor('#00FF00').setTitle('Novo Comando').setDescription('Este é meu novo comando!');

    await interaction.reply({ embeds: [embed] });
  },
};
```

### Passo 3: Registrar Comando

```bash
node deploy-commands.js
```

### Passo 4: Reiniciar Bot

```bash
Ctrl+C
npm start
```

### Passo 5: Testar no Discord

```
/novo
```

## 13.3 Personalizações Comuns

### Mudar Cores do Embed

Em qualquer arquivo `.js`, encontre `.setColor()`:

```javascript
// Exemplos:
.setColor('#FFD700')    // Ouro
.setColor('#FF0000')    // Vermelho
.setColor('#00FF00')    // Verde
.setColor('#0000FF')    // Azul
.setColor('#RANDOM')    // Aleatória
```

### Mudar Emojis

Em `commands/poll.js`, encontre a array de emojis:

```javascript
const emojisDisponiveis = ['🇦', '🇧', '🇨' /* ... */];

// Alterne para seus emojis favoritos
const emojisDisponiveis = ['✅', '❌', '🤔' /* ... */];
```

### Mudar Mensagens

Localize strings de mensagem e edite:

```javascript
// Encontre:
content: '❌ Permissão negada!';

// Edite para:
content: '🚫 Você não tem permissão para isso!';
```

### Adicionar Cargos Especiais

Em `commands/poll.js` (ou outro), adicione:

```javascript
const cargoPermitido = interaction.member.roles.cache.some((role) => role.name === 'Moderador');

if (!cargoPermitido) {
  return await interaction.reply({
    content: '❌ Apenas moderadores podem usar isso!',
    ephemeral: true,
  });
}
```

---

# 14. REFERÊNCIAS

## 14.1 Discord.js

- **Documentação:** https://discord.js.org
- **Guia Oficial:** https://discordjs.guide
- **GitHub:** https://github.com/discordjs/discord.js
- **Exemplos:** https://github.com/discordjs/discord.js/tree/main/examples

## 14.2 Discord API

- **Developer Portal:** https://discord.com/developers/applications
- **API Docs:** https://discord.com/developers/docs
- **API v10:** https://discord.com/developers/docs/reference

## 14.3 Node.js

- **Documentação:** https://nodejs.org/docs
- **NPM:** https://npmjs.com
- **npm CLI:** https://docs.npmjs.com/cli

## 14.4 Recursos Adicionais

### Tutoriais

- Discord.js Guide: https://discordjs.guide
- Node.js Course: https://nodejs.dev

### Ferramentas

- VS Code: https://code.visualstudio.com
- Git: https://git-scm.com
- PM2: https://pm2.keymetrics.io

## 14.5 Comunidades

- **Discord.js Server:** https://discord.gg/discord.js
- **Stack Overflow:** https://stackoverflow.com/questions/tagged/discord.js
- **Reddit:** /r/discordapp, /r/nodejs

---

# 📌 RESUMO EXECUTIVO

## ✅ O que você tem

Um **bot Discord profissional e completo** para gerenciar votações de Clube do Livro com:

- ✅ 4 comandos slash funcionais
- ✅ Sistema de peso de votos (VIP = 2, Comum = 1)
- ✅ Persistência de dados em JSON
- ✅ Botão de encerramento protegido
- ✅ Proteção de permissões
- ✅ Histórico de votações
- ✅ Documentação completa
- ✅ Código comentado e organizado

## 🚀 Para começar

```bash
npm install
cp .env.example .env
# Edite .env com seus valores
node deploy-commands.js
npm start
```

## 📚 Próximos Passos

1. **Leia:** Este arquivo (você está aqui!)
2. **Configure:** Seu archivo `.env` com TOKEN e CLIENT_ID
3. **Registre:** Comandos com `node deploy-commands.js`
4. **Inicie:** Bot com `npm start`
5. **Teste:** Crie uma enquete com `/enquete`

## 💡 Dicas

- Use o botão 🛑 em vez do comando `/encerrar` (mais fácil)
- Adicione VIPs com `/mensalista adicionar`
- Consulte `historico-votacoes.json` para ver resultados passados
- Use PM2 para manter bot rodando em produção

## 🎉 Você é um desenvolvedor bot agora!

Divirta-se! 🚀

---

**Versão:** 3.0  
**Última atualização:** 25 de fevereiro de 2026  
**Status:** ✅ Produção
