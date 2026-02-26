# 📚 LittleBoatPoll - Bot Discord para Clube do Livro

Um bot Discord completo para realizar votações no Clube do Livro com sistema inteligente de peso de votos (mensalistas têm peso 2).

**Versão:** 1.2 | **Data:** 26 de fevereiro de 2026 | **Status:** ✅ Produção

## ✨ Recursos Principais

- 🗳️ **Criação de Enquetes** - Crie votações customizáveis
- 👑 **Sistema de Peso** - Mensalistas têm votos com peso 2x
- 📊 **Resultados Automáticos** - Cálculo inteligente com ranking
- 📋 **Histórico Completo** - Todas as votações são registradas
- 📝 **Sistema de Rascunhos** - Crie e edite enquetes antes de publicar
- ➕ **Gerenciamento de Opções** - Adicione/remova opções individualmente

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

### Sistema de Enquetes Diretas

#### `/enquete`

**Criar uma nova enquete para votação imediata**

**Opções:**

- `nome-da-enquete` (obrigatório) - Nome/Título da enquete
- `opcoes` (obrigatório) - Opções separadas por vírgula (ex: Livro A, Livro B, Livro C)
- `max-votos` (obrigatório) - Número máximo de votos por pessoa (1-20)
- `peso_mensalista` (obrigatório) - Mensalistas têm peso 2 nos votos? (Sim/Não)

**Exemplo:**

```
/enquete nome-da-enquete:"Qual livro ler em fevereiro?" opcoes:"Livro A, Livro B, Livro C" max-votos:1 peso_mensalista:Sim
```

---

### Sistema de Rascunhos (v1.0+)

O sistema de rascunhos permite criar e editar enquetes **antes** de publicá-las para votação.

#### `/rascunho criar`

**Cria um novo rascunho de enquete**

**Opções:**

- `titulo` (obrigatório) - Título da enquete
- `opcoes` (obrigatório) - Opções separadas por vírgula
- `max_votos` (obrigatório) - Número máximo de votos por pessoa
- `peso_mensalista` (opcional) - Mensalistas têm peso 2? (Sim/Não)

**Exemplo:**

```
/rascunho criar titulo:"Votação de Livros" opcoes:"Livro A, Livro B, Livro C" max_votos:2 peso_mensalista:Sim
```

**Retorna:** ID único do rascunho (ex: `A1B2C3D4`)

---

#### `/rascunho editar`

**Edita um rascunho existente**

**Opções:**

- `id` (obrigatório) - ID do rascunho
- `titulo` (opcional) - Novo título
- `opcoes` (opcional) - Novas opções (substitui todas)
- `max_votos` (opcional) - Novo máximo de votos
- `peso_mensalista` (opcional) - Alterar peso

**Exemplo:**

```
/rascunho editar id:A1B2C3D4 titulo:"Novo Título" max_votos:1
```

**Nota:** Apenas campos especificados serão alterados

---

#### `/rascunho adicionar-opcao` (v1.2)

**Adiciona opções ao rascunho sem remover as existentes**

**Opções:**

- `id` (obrigatório) - ID do rascunho
- `opcoes` (obrigatório) - Novas opções separadas por vírgula

**Exemplo:**

```
/rascunho adicionar-opcao id:A1B2C3D4 opcoes:"Livro D, Livro E"
```

**Validações:**

- ✅ Verifica duplicatas (case-insensitive)
- ✅ Limita a 20 opções (Discord)
- ✅ Ajusta max_votos automaticamente

---

#### `/rascunho remover-opcao` (v1.2)

**Remove uma opção específica do rascunho**

**Opções:**

- `id` (obrigatório) - ID do rascunho
- `opcao` (obrigatório) - Texto da opção ou número (1, 2, 3...)

**Exemplo por texto:**

```
/rascunho remover-opcao id:A1B2C3D4 opcao:"Livro B"
```

**Exemplo por número:**

```
/rascunho remover-opcao id:A1B2C3D4 opcao:2
```

**Validações:**

- ✅ Mantém mínimo de 2 opções
- ✅ Case-insensitive
- ✅ Ajusta max_votos automaticamente

---

#### `/rascunho listar`

**Lista todos os rascunhos disponíveis**

**Mostra:** ID, Título, Número de opções, Criador, Data de criação

---

#### `/rascunho exibir`

**Mostra detalhes completos de um rascunho**

**Opções:**

- `id` (obrigatório) - ID do rascunho

---

#### `/rascunho publicar`

**Publica um rascunho como enquete ativa**

**Opções:**

- `id` (obrigatório) - ID do rascunho
- `canal` (opcional) - Canal onde publicar (padrão: canal atual)

**Exemplo:**

```
/rascunho publicar id:A1B2C3D4 canal:#votações
```

**O que acontece:**

1. Rascunho é convertido em enquete ativa
2. Mensagem enviada com reações
3. Votação começa imediatamente
4. Rascunho é removido

---

#### `/rascunho deletar`

**Remove um rascunho permanentemente**

**Opções:**

- `id` (obrigatório) - ID do rascunho

⚠️ **Atenção:** Ação não pode ser desfeita!

---

### Outros Comandos

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

### Opção 1: Publicar Enquete Imediatamente

```
1. /enquete nome-da-enquete:"Qual livro?" opcoes:"A,B,C" max-votos:1 peso_mensalista:Sim
2. Membros votam clicando nas reações
3. Clique direito → Aplicativos → Encerrar Votação
```

### Opção 2: Usar Sistema de Rascunhos

```
1. /rascunho criar titulo:"Votação" opcoes:"A,B" max_votos:1
   [Recebe ID: ABC123]

2. /rascunho adicionar-opcao id:ABC123 opcoes:"C,D"
   [Agora tem 4 opções]

3. /rascunho remover-opcao id:ABC123 opcao:"B"
   [Remove opção indesejada]

4. /rascunho exibir id:ABC123
   [Confirma tudo]

5. /rascunho publicar id:ABC123
   [Enquete ao vivo!]
```

### Gerenciamento de Opções de Rascunho

**Antes (v1.0-1.1):**

```
Tinha: A, B, C
Para adicionar D: /rascunho editar opcoes:"A,B,C,D"
(tinha que reescrever tudo)
```

**Agora (v1.2):**

```
Tem: A, B, C
Para adicionar D: /rascunho adicionar-opcao opcoes:"D"
(só adiciona o novo!)

Para remover B: /rascunho remover-opcao opcao:"B"
ou: /rascunho remover-opcao opcao:2
```

## 📊 Exemplos Práticos

### Exemplo 1: Criando Enquete Simples

```
/rascunho criar
  titulo: "Livro de Março 2026"
  opcoes: "1984, Brave New World, Fahrenheit 451"
  max_votos: 1
  peso_mensalista: Sim

[ID: XYZ789]

/rascunho publicar id:XYZ789
```

### Exemplo 2: Editando Rascunho Progressivamente

```
1. Criar base:
   /rascunho criar titulo:"Votação" opcoes:"A,B" max_votos:1

2. Adicionar mais opções:
   /rascunho adicionar-opcao id:[ID] opcoes:"C,D,E"

3. Remover uma opção:
   /rascunho remover-opcao id:[ID] opcao:"B"

4. Mudar título:
   /rascunho editar id:[ID] titulo:"Votação Final"

5. Publicar:
   /rascunho publicar id:[ID]
```

### Exemplo 3: Combinando Todos os Comandos

```
/rascunho criar titulo:"Escolha" opcoes:"X,Y" max_votos:1
/rascunho adicionar-opcao id:[ID] opcoes:"Z,W"     # Tem: X,Y,Z,W
/rascunho remover-opcao id:[ID] opcao:2            # Remove Y
/rascunho editar id:[ID] max_votos:2               # Altera max
/rascunho adicionar-opcao id:[ID] opcoes:"V"       # Adiciona V
/rascunho exibir id:[ID]                           # Confirma
/rascunho publicar id:[ID] canal:#votacoes         # Publica
```

## ⚖️ Validações e Regras

### Limites de Opções

- **Mínimo**: 2 opções
- **Máximo**: 20 opções (limite do Discord)
- Ao remover opções, mínimo de 2 será mantido
- Ao adicionar opções, máximo de 20 será respeitado

### Duplicação de Opções

- Sistema detecta duplicatas **case-insensitive**
- "Opção A" é igual a "opção a" e "OPÇÃO A"
- Ao adicionar opções, duplicatas não são permitidas
- Mensagem de erro lista quais opções já existem

### Max Votos

- Ajuste automático quando número de opções muda
- Se `max_votos` > número de opções: ajusta automaticamente
- **Exemplo**: Tinha 5 opções com `max_votos:3`, removeu 2 opções → `max_votos` vira 3
- Sistema notifica quando ajuste ocorre

### Permissões

- **Criar rascunho**: Apenas criador original ou Admin
- **Editar rascunho**: Apenas criador original ou Admin
- **Adicionar/Remover opções**: Apenas criador original ou Admin
- **Publicar rascunho**: Apenas criador original ou Admin
- **Deletar rascunho**: Apenas criador original ou Admin
- **Listar rascunhos**: Todos podem ver
- **Exibir rascunho**: Todos podem ver

### Remoção de Opções

- Aceita texto: `opcao:"Nome da Opção"`
- Aceita número: `opcao:2` (posição 1-based)
- Busca case-insensitive para texto
- Valida se opção existe antes de remover

### Persistência

- **Salvamento Automático**: Rascunhos são salvos automaticamente em `draft-polls.json` após cada operação (criar, editar, adicionar opção, remover opção, deletar)
- **Carregamento na Inicialização**: Todos os rascunhos são carregados automaticamente quando o bot é iniciado
- **Recuperação Após Reinicialização**: Seus rascunhos permanecem disponíveis mesmo após o bot ser desligado ou reiniciado
- **Formato Normalizado**: Dados salvos com todas as propriedades garantindo compatibilidade
- **Operações que Salvam Automaticamente**:
  - `/rascunho criar` - Salva novo rascunho
  - `/rascunho editar` - Salva alterações
  - `/rascunho adicionar-opcao` - Salva novas opções
  - `/rascunho remover-opcao` - Salva após remoção
  - `/rascunho deletar` - Remove do arquivo
  - `/rascunho publicar` - Remove rascunho e salva enquete ativa

## 📋 Changelog

### v1.2 (Fevereiro 2026) - Gerenciamento Individual de Opções

**Novos Comandos:**

- `/rascunho adicionar-opcao` - Adiciona opções sem perder as existentes
- `/rascunho remover-opcao` - Remove opções específicas (por texto ou número)

**Melhorias:**

- Detecção de duplicatas case-insensitive
- Ajuste automático de `max_votos` ao adicionar/remover opções
- Validação de limites (2-20 opções)
- Remoção por número de posição (1-based)
- Mensagens de erro mais informativas

**Alterações:**

- Sistema de opções agora permite edição incremental
- Não é mais necessário reescrever todas as opções ao editar

### v1.1 (Fevereiro 2026) - Sistema de Rascunhos

**Novos Recursos:**

- Sistema completo de rascunhos de enquetes
- 6 subcomandos: criar, editar, listar, exibir, publicar, deletar
- IDs únicos de 8 caracteres (hex)
- Persistência em `draft-polls.json`
- Preview antes de publicar

**Comandos Adicionados:**

- `/rascunho criar` - Cria novo rascunho
- `/rascunho editar` - Edita campos do rascunho
- `/rascunho listar` - Lista seus rascunhos
- `/rascunho exibir` - Mostra preview do rascunho
- `/rascunho publicar` - Converte rascunho em enquete ativa
- `/rascunho deletar` - Remove rascunho permanentemente

**Alterações:**

- `index.js`: Adicionado Map `client.draftPolls` e funções de persistência
- Estrutura de dados: Novos campos `createdAt`, `creatorId`, `creatorUsername`

### v1.0 (Inicial) - Bot de Enquetes Básico

**Recursos Base:**

- Comando `/enquete` para criar votações
- Sistema de peso para mensalistas (2x)
- Comando de contexto "Encerrar Votação"
- Gerenciamento de mensalistas (`/mensalista`)
- Gerenciamento de cargos criadores (`/criadores`)
- Persistência em arquivos JSON
- Histórico de votações

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
│   ├── draft.js                  # Comando /rascunho (v1.1+)
│   ├── encerrar-context.js       # Comando de contexto: Encerrar Votação
│   ├── criadores.js              # Comando /criadores
│   └── mensalista.js             # Comando /mensalista
│
├── draft-polls.json              # Rascunhos de enquetes (auto-gerado v1.1+)
├── active-polls.json             # Votações ativas (auto-gerado)
├── historico-votacoes.json       # Histórico completo (auto-gerado)
├── mensalistas.json              # Lista de mensalistas (auto-gerado)
├── cargos-criadores.json         # Cargos autorizados (auto-gerado)
└── votos.json                    # Registro de votos (auto-gerado)
```

## 🔧 Arquivos de Dados

### `draft-polls.json` (v1.1+)

Armazena rascunhos de enquetes em desenvolvimento

```json
{
  "A1B2C3D4": {
    "id": "A1B2C3D4",
    "titulo": "Votação em Rascunho",
    "opcoes": ["Opção A", "Opção B", "Opção C"],
    "max_votos": 1,
    "peso_mensalista": true,
    "creatorId": "123456789",
    "creatorUsername": "Usuario#1234",
    "createdAt": "2026-02-25T..."
  }
}
```

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
