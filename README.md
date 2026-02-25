# LittleBoatPoll 🚤

Bot Discord para gerenciar votações do Clube do Livro com sistema avançado de ponderação de votos.

## 📋 Descrição

**LittleBoatPoll** é um bot Discord especializado em organizar e gerenciar enquetes para comunidades de leitura. O bot permite criar votações com múltiplas opções, controlar o número máximo de votos por pessoa e aplicar peso diferenciado para membros mensalistas (com peso duplo).

## ✨ Características Principais

- ✅ **Criação de Enquetes Personalizadas** - Crie votações com título, múltiplas opções e limites customizáveis
- ✅ **Sistema de Peso de Votos** - Membros mensalistas podem ter peso 2 nos votos (opcional)
- ✅ **Controle por Permissões** - Apenas administradores ou usuários com cargos autorizados podem criar enquetes
- ✅ **Votação por Reações** - Interface intuitiva usando emojis do Discord
- ✅ **Histórico de Votações** - Registro completo de todas as votações realizadas
- ✅ **Gerenciamento de Mensalistas** - Sistema para gerenciar membros mensalistas
- ✅ **Persistência de Dados** - Votações são salvas em arquivo JSON
- ✅ **Status em Tempo Real** - Acompanhe o progresso das votações ativas

## 🚀 Início Rápido

### Requisitos

- Node.js 16.0.0 ou superior
- Uma aplicação Discord Bot criada no [Discord Developer Portal](https://discord.com/developers/applications)
- Token do bot Discord

### Instalação

1. **Clone ou baixe o repositório**

```bash
cd LittleBoatPoll
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_GUILD_ID=seu_guild_id_aqui
```

4. **Implante os comandos slash**

```bash
npm run deploy
```

5. **Inicie o bot**

```bash
npm start
```

## ⚙️ Configuração

### Arquivo .env

| Variável            | Descrição                                     | Obrigatório |
| ------------------- | --------------------------------------------- | ----------- |
| `DISCORD_TOKEN`     | Token do bot (encontre em Applications → Bot) | ✅          |
| `DISCORD_CLIENT_ID` | ID da aplicação                               | ✅          |
| `DISCORD_GUILD_ID`  | ID do servidor Discord                        | ✅          |

### Autorizar Cargos para Criar Enquetes

O arquivo `cargos-criadores.json` controla quais cargos podem criar enquetes:

```json
{
  "cargos": ["123456789012345678", "987654321098765432"]
}
```

Adicione os IDs dos cargos que podem criar enquetes (além de administradores, que sempre têm permissão).

## 📊 Comandos

### `/enquete`

Cria uma nova enquete para votação.

**Opções:**

- `titulo` (obrigatório) - Título da enquete
- `opcoes` (obrigatório) - Opções separadas por vírgula
- `max_votos` (obrigatório) - Número máximo de votos por pessoa
- `peso_mensalista` (obrigatório) - Mensalistas têm peso duplo? (Sim/Não)

**Exemplo:**

```
/enquete titulo:"Próximo livro do clube" opcoes:"1984, O Cortiço, O Alienista" max_votos:1 peso_mensalista:Sim
```

### `/iniciar`

Inicia o período de votação para uma enquete.

**Opções:**

- `mensagem_id` (obrigatório) - ID da mensagem da enquete

**Como obter o ID da mensagem:**

1. Ative o modo de desenvolvedor no Discord (User Settings → Advanced)
2. Clique com botão direito na mensagem e selecione "Copiar ID da Mensagem"

### `/encerrar`

Finaliza a votação e exibe os resultados.

**Opções:**

- `mensagem_id` (obrigatório) - ID da mensagem da enquete

### `/criadores`

Gerencia cargos autorizados para criar enquetes.

**Subcomandos:**

- `adicionar` - Adiciona um cargo à lista de criadores
- `remover` - Remove um cargo da lista
- `listar` - Exibe a lista de cargos autorizados

### `/mensalista`

Gerencia a lista de membros mensalistas.

**Subcomandos:**

- `adicionar` - Adiciona um membro como mensalista
- `remover` - Remove um membro da lista
- `listar` - Exibe todos os mensalistas

## 📁 Arquivos de Dados

O bot cria automaticamente os seguintes arquivos JSON:

| Arquivo                   | Descrição                               |
| ------------------------- | --------------------------------------- |
| `active-polls.json`       | Votações ativas em tempo real           |
| `historico-votacoes.json` | Registro histórico de todas as votações |
| `mensalistas.json`        | Lista de membros mensalistas            |
| `cargos-criadores.json`   | Cargos autorizados para criar enquetes  |
| `votos.json`              | Registro detalhado de votos por usuário |

## 🔐 Permissões Necessárias

Certifique-se de que o bot tem as seguintes permissões no Discord:

- ✅ Ver Canais
- ✅ Enviar Mensagens
- ✅ Adicionar Reações
- ✅ Ler Histórico de Mensagens
- ✅ Usar Comandos de Barra (/)

## 🛠️ Scripts Disponíveis

| Comando          | Descrição                             |
| ---------------- | ------------------------------------- |
| `npm start`      | Inicia o bot                          |
| `npm run deploy` | Implanta os comandos slash no Discord |
| `npm run dev`    | Inicia o bot (alias para start)       |
| `npm test`       | Deploy + Start                        |

## 📝 Estrutura do Projeto

```
LittleBoatPoll/
├── index.js                      # Arquivo principal do bot
├── deploy-commands.js            # Script para implantar comandos
├── package.json                  # Dependências do projeto
├── .env                          # Variáveis de ambiente
├── README.md                     # Esta documentação
├── commands/                     # Pasta com todos os comandos
│   ├── poll.js                   # Comando /enquete
│   ├── iniciar.js                # Comando /iniciar
│   ├── encerrar.js               # Comando /encerrar
│   ├── criadores.js              # Comando /criadores
│   └── mensalista.js             # Comando /mensalista
├── active-polls.json             # Votações ativas (auto-gerado)
├── historico-votacoes.json       # Histórico (auto-gerado)
├── mensalistas.json              # Mensalistas (auto-gerado)
├── cargos-criadores.json         # Cargos (auto-gerado)
└── votos.json                    # Registro de votos (auto-gerado)
```

## 🎯 Como Usar

### Passo 1: Criar uma Enquete

```
/enquete titulo:"Qual livro?" opcoes:"Livro A, Livro B, Livro C" max_votos:1 peso_mensalista:Sim
```

### Passo 2: Iniciar a Votação

1. Copie o ID da mensagem da enquete
2. Use `/iniciar mensagem_id:123456789`

### Passo 3: Membros Votam

- Clique nas reações com emojis para votar
- Pode-se mudar o voto clicando em outra reação

### Passo 4: Encerrar e Ver Resultados

1. Use `/encerrar mensagem_id:123456789`
2. O bot exibirá os resultados com contagem de votos

## 🐛 Solução de Problemas

### O bot não responde aos comandos

- [ ] Verifique se o token está correto no `.env`
- [ ] Verifique se os comandos foram implantados com `npm run deploy`
- [ ] Certifique-se de que o bot tem permissão para usar comandos slash no canal

### As reações não funcionam

- [ ] Verifique se o bot tem permissão "Adicionar Reações"
- [ ] Verifique se o número de opções não ultrapassa 20 (limite do Discord)

### Erro ao salvar enquetes

- [ ] Certifique-se de que a pasta tem permissão de leitura/escrita
- [ ] Verifique se há espaço disponível no disco

## 📦 Dependências

- **discord.js** (^14.25.1) - Biblioteca oficial para interação com Discord
- **dotenv** (^17.3.1) - Carregamento de variáveis de ambiente

## 📄 Licença

MIT - Sinta-se livre para usar e modificar este projeto

## 👨‍💻 Autor

LittleBoatPoll © 2026

---

**Precisa de ajuda?** Abra uma issue no repositório ou consulte a documentação do [discord.js](https://discord.js.org/)
