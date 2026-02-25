# 📚 LittleBoatPoll - Bot Discord para Clube do Livro

Um bot Discord completo para realizar votações no Clube do Livro com sistema inteligente de peso de votos (mensalistas têm peso 2).

## ✨ Recursos Principais

- 🗳️ **Criação de Enquetes** - Crie votações customizáveis
- 👑 **Sistema de Peso** - Mensalistas têm votos com peso 2x
- 📊 **Resultados Automáticos** - Cálculo inteligente com ranking
- 📋 **Histórico Completo** - Todas as votações são registradas

## 📋 Requisitos

- Node.js v18.0+
- npm ou yarn
- Token de Bot Discord
- Application ID do Bot

## 🚀 Instalação

### 1. Clonar o repositório

```bash
git clone <seu-repositorio>
cd LittleBoatPoll
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
TOKEN=seu_token_do_bot_aqui
CLIENT_ID=seu_application_id_aqui
```

**Como obter as credenciais:**

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em "New Application"
3. Vá em **Bot** e clique "Add Bot"
4. Em **TOKEN**, clique "Copy" e cole no `.env`
5. Em **General Information**, copie o **Application ID** para o `.env`
6. Salve o arquivo `.env`

### 4. Registrar comandos no Discord

```bash
npm run deploy
```

### 5. Iniciar o bot

```bash
npm start
```

Você verá a mensagem: `✅ LittleBoatPoll está ONLINE!`

## 📖 Comandos Disponíveis

### `/enquete`

**Criar uma nova enquete para votação**

**Opções:**

- `nome-da-enquete` (obrigatório) - Nome/Título da enquete
- `opcoes` (obrigatório) - Opções separadas por vírgula (ex: Livro A, Livro B, Livro C)
- `max-votos` (obrigatório) - Número máximo de votos por pessoa (1-20)
- `peso_mensalista` (obrigatório) - Mensalistas têm peso 2 nos votos? (Sim/Não)

**Exemplo:**

```
/enquete nome-da-enquete:"Qual livro ler em fevereiro?" opcoes:"Nada de Novo" max-votos:1 peso_mensalista:Sim
```

---

### **Encerrar Votação** (Comando de Contexto)

**Encerra a votação e exibe resultados finais**

**Como usar:**

1. Clique com botão direito na mensagem da enquete
2. Selecione "Aplicativos"
3. Clique em "Encerrar Votação"
4. O bot exibirá o resultado com ranking das opções

---

### `/mensalista`

**Gerencia a lista de mensalistas do Clube do Livro**

**Subcomandos:**

#### `adicionar @usuario`

Adiciona um usuário à lista de mensalistas (peso 2x nos votos)

#### `remover @usuario`

Remove um usuário da lista de mensalistas

#### `listar`

Mostra todos os mensalistas cadastrados

**Exemplo:**

```
/mensalista adicionar usuario:@João
/mensalista listar
```

---

### `/criadores`

**Gerencia cargos autorizados a criar enquetes**

**Subcomandos:**

#### `adicionar @cargo`

Adiciona um cargo autorizado a criar enquetes

#### `remover @cargo`

Remove um cargo autorizado

#### `listar`

Mostra todos os cargos autorizados

**Exemplo:**

```
/criadores adicionar cargo:@Moderadores
```

## 🎯 Guia de Uso Rápido

### Passo 1: Criar uma Enquete

Use o comando `/enquete` para criar uma votação:

```
/enquete nome-da-enquete:"Qual livro?" opcoes:"A,B,C" max-votos:1 peso_mensalista:Sim
```

O bot criará uma mensagem com:

- Título da enquete
- Opções em negrito
- Reações com emojis para votar

### Passo 2: Membros Votam

- Clique nas reações com emojis (🇦, 🇧, 🇨, etc)
- Pode-se votar em até X opções (conforme configurado)
- Clique novamente para mudar o voto

### Passo 3: Encerrar e Ver Resultados

Clique direito na mensagem → Aplicativos → Encerrar Votação

O bot exibirá o resultado com ranking das opções

## 📁 Estrutura do Projeto

```
LittleBoatPoll/
├── index.js                      # Arquivo principal do bot
├── deploy-commands.js            # Script para registrar comandos
├── package.json                  # Dependências do projeto
├── package-lock.json             # Lock file
├── .env                          # Configurações (TOKEN, CLIENT_ID)
├── .env.example                  # Exemplo de configuração
├── .gitignore                    # Arquivos ignorados no Git
├── README.md                     # Esta documentação
├── COMENTARIOS_DETALHADOS.js     # Explicações de código
├── SETUP_DISCORD.js              # Guia de setup (referência)
│
├── commands/                     # Pasta com todos os comandos
│   ├── poll.js                   # Comando /enquete
│   ├── encerrar-context.js       # Comando de contexto: Encerrar Votação
│   ├── criadores.js              # Comando /criadores
│   └── mensalista.js             # Comando /mensalista
│
├── active-polls.json             # Votações ativas (auto-gerado)
├── historico-votacoes.json       # Histórico completo (auto-gerado)
├── mensalistas.json              # Lista de mensalistas (auto-gerado)
├── cargos-criadores.json         # Cargos autorizados (auto-gerado)
└── votos.json                    # Registro de votos (auto-gerado)
```

## 🔧 Arquivos de Dados

### `active-polls.json`

Armazena todas as votações ativas em memória

### `historico-votacoes.json`

Registro histórico de todas as votações já realizadas

```json
{
  "titulo": "Qual livro?",
  "opcoes": ["Opção A", "Opção B"],
  "resultados": [...],
  "vencedor": "Opção A",
  "participantes": 10,
  "dataCriacao": "2026-02-25T...",
  "dataFinalizacao": "2026-02-25T..."
}
```

### `mensalistas.json`

Lista de IDs de usuários mensalistas (peso 2x)

### `cargos-criadores.json`

Lista de IDs de cargos autorizados a criar enquetes

## ⚙️ Scripts Disponíveis

```bash
npm start      # Inicia o bot
npm run deploy # Registra/atualiza comandos no Discord
npm run dev    # Inicia em modo desenvolvimento
```

## 🔐 Permissões

- **`/enquete`**: Apenas administradores ou cargos autorizados
- **`Encerrar Votação`**: Apenas administradores ou cargos autorizados
- **`/mensalista`**: Apenas administradores ou cargos autorizados (adicionar/remover); Todos (listar)
- **`/criadores`**: Apenas administradores

## 📊 Lógica de Peso de Votos

- **Mensalistas**: Peso 2 (votam em dobro)
- **Usuários comuns**: Peso 1

Exemplo:

- 5 usuários comuns votam em "Opção A" = 5 pontos
- 3 mensalistas votam em "Opção B" = 6 pontos (3 × 2)
- **Vencedor**: Opção B

## 🐛 Troubleshooting

### Bot não conecta

- Verifique se o TOKEN está correto no `.env`
- Confirme que o bot está autorizado no servidor

### Comandos não aparecem

- Execute `npm run deploy`
- Aguarde alguns minutos para o Discord sincronizar

### Reações não funcionam

- Certifique-se de que o bot tem permissão "Add Reactions" no canal
- Verifique se a enquete foi criada corretamente

## 📝 Notas Importantes

- Nunca compartilhe seu `TOKEN` ou `CLIENT_ID`
- O arquivo `.env` nunca deve ser commitado no Git (está em `.gitignore`)
- Votações ativas são salvas e carregadas automaticamente ao reiniciar o bot

## 📞 Suporte

Para mais informações sobre Discord.js, visite:

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers)

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para o Clube do Livro**
