# Arquitetura - Little Boat Poll

Entenda como o projeto é estruturado e como os componentes trabalham juntos.

## Visão Geral

```
Discord Bot (discord.js)
        ↓
    index.js (core)
        ↓
        ├─→ Commands (slash + context menus)
        │   ├─ Polls (enquetes)
        │   ├─ Users (mensalistas)
        │   └─ Admin (administrativo)
        │
        ├─→ Utils (shared logic)
        │   ├─ Permissions (validação)
        │   ├─ File Handler (I/O JSON)
        │   ├─ Validators (regras)
        │   └─ Error Handler (tratamento)
        │
        └─→ Data (JSON files)
            ├─ prod/ (produção)
            └─ staging/ (testes)
```

## Fluxo de uma Requisição

```
1. User runs /poll create "Which book?"
   ↓
2. Discord.js intercepta (client.interactionCreate)
   ↓
3. Route para comando específico: src/commands/polls/poll.js
   ↓
4. Comando valida entrada (src/utils/validators.js)
   ↓
5. Comando checa permissões (src/utils/permissions.js)
   ↓
6. Comando persiste dados (src/utils/file-handler.js)
   ↓
7. Comando responde no Discord
   ↓
8. activePolls em memória atualizado (client.activePolls)
```

## Estrutura de Diretórios

### `/src` - Código Principal

```
src/
├── core/
│   ├── index.js              ← Arquivo principal (entry point)
│   └── scripts/              ← Scripts utilitários (se houver)
│
├── commands/                 ← Todos os comandos Discord
│   ├── polls/                ← Domínio: Enquetes
│   │   ├── poll.js           ├─ Comando /poll (criar, editar, visualizar)
│   │   ├── criador-de-enquete.js  ├─ Comando para criar enquetes
│   │   └── draft.js          └─ Rascunhos de enquetes
│   │
│   ├── users/                ← Domínio: Usuários
│   │   ├── mensalista.js     ├─ Gerenciar mensalistas
│   │   ├── mensalista-toggle-context.js
│   │   └── criador-toggle-context.js
│   │
│   └── admin/                ← Domínio: Administrativo
│       ├── encerrar-context.js   ├─ Encerrar enquetes
│       └── toggle-opcao-context.js └─ Alternar opções
│
└── utils/                    ← Código Compartilhado
    ├── config.js             ├─ Configuração centralizada
    ├── constants.js          ├─ Constantes globais
    ├── permissions.js        ├─ Validação de permissões
    ├── validators.js         ├─ Regras de validação
    ├── file-handler.js       ├─ I/O JSON (persistência)
    ├── error-handler.js      ├─ Tratamento de erros
    ├── draft-handler.js      ├─ Rascunhos de enquetes
    └── mensalista-binding.js └─ Sincronização mensalistas
```

### `/tests` - Testes Automatizados

```
tests/
├── unit/                     ← Testes unitários (1 componente)
│   ├── utils/
│   │   ├── config.test.js
│   │   ├── permissions.test.js
│   │   ├── validators.test.js
│   │   ├── file-handler.test.js
│   │   └── ...
│   │
│   ├── commands/
│   │   ├── polls/
│   │   ├── users/
│   │   └── admin/
│   │
│   └── README.md
│
└── integration/              ← Testes integração (múltiplos componentes)
    └── (a serem adicionados)
```

### `/data` - Persistência de Dados

```
data/
└── environments/
    ├── prod/                 ← Dados de produção
    │   ├── active-polls.json       ├─ Enquetes ativas
    │   ├── draft-polls.json        ├─ Rascunhos
    │   ├── mensalistas.json        ├─ Usuários mensalistas
    │   ├── criadores-internos.json ├─ Criadores autorizados
    │   ├── role-bindings.json      ├─ Cargos Discord
    │   └── historico-votacoes.json └─ Histórico de votações
    │
    └── staging/              ← Dados de teste/homologação
        └── (estrutura idêntica a prod/)
```

### `/docs` - Documentação

```
docs/
├── development/              ← Docs de desenvolvimento
│   ├── SETUP.md             ├─ Setup local (5 min)
│   ├── GIT-WORKFLOW.md      ├─ GitHub Flow passo-a-passo
│   └── ARCHITECTURE.md      └─ Este arquivo!
│
└── technical/               ← Docs técnicas (já existentes)
    ├── setup-discord.md     ├─ Configurar Discord Dev Portal
    ├── staging-bot.md       ├─ Ambiente de testes
    └── ...
```

### `/config` - Configuração da Aplicação

```
config/
└── defaults.js              ← Constantes padrão (futura expansão)
```

### `/.github` - Integração GitHub

```
.github/
└── workflows/
    └── test.yml             ← CI/CD: testa cada PR
```

## Responsabilidades por Componente

### `src/core/index.js`
- **Responsabilidade:** Orquestração principal
- **O que faz:**
  - Carrega variáveis de ambiente
  - Inicializa cliente Discord
  - Registra comandos
  - Gerencia estado em memória (activePolls, draftPolls)
  - Define listeners (interactionCreate, ready, etc.)

### `src/commands/*`
- **Responsabilidade:** Implementar lógica de cada comando
- **Padrão esperado:**
  ```javascript
  module.exports = {
    data: new SlashCommandBuilder()...  // Define comando
    execute: async (interaction) => {   // Lógica do comando
      // 1. Valida entrada (validators)
      // 2. Checa permissões (permissions)
      // 3. Persiste dados (file-handler)
      // 4. Responde ao usuário
    }
  };
  ```
- **Restrição:** **Não acesse diretamente o sistema de arquivos** - sempre use `file-handler.js`

### `src/utils/*`
- **Responsabilidade:** Lógica compartilhada entre comandos
- **Exemplos:**
  - `permissions.js`: "Usuário pode criar enquete?"
  - `validators.js`: "Dados da enquete são válidos?"
  - `file-handler.js`: "Salvar/carregar JSON com segurança"
  - `config.js`: "Qual é a porta? Qual é a pasta de dados?"

## Fluxo de Dados

### Salvando uma Enquete

```
Command (poll.js)
  ↓ input validation
src/utils/validators.js
  ↓ valid? ✓
src/utils/permissions.js (checa se criador autorizado)
  ↓ authorized? ✓
src/utils/file-handler.js → saveJsonFile()
  ↓ escreve em data/environments/{APP_ENV}/active-polls.json
client.activePolls.set(id, poll)  ← memória
  ↓
Discord: "Poll created!"
```

### Votando em uma Enquete

```
Discord User clica 🔵
  ↓
Discord.js → messageReactionAdd handler
  ↓
src/core/index.js (listener)
  ↓ find poll by reaction
client.activePolls.get(pollId)  ← memória
  ↓ validate voter
src/utils/mensalista-binding.js
  ↓ user is mensalista? (weight 2x)
src/utils/validators.js
  ↓
update poll totals
src/utils/file-handler.js → saveJsonFile()  ← persistência
  ↓
Update Discord message with new results
```

## Multi-Ambiente (prod vs staging)

### Via Variável APP_ENV

```bash
# Produção (padrão)
APP_ENV=prod npm start
# Usa: data/environments/prod/

# Staging/Testes
APP_ENV=staging npm start
# Usa: data/environments/staging/
```

**Arquivo `.env.staging` isolado:**
```env
TOKEN=seu_staging_token_diferente
CLIENT_ID=seu_staging_client_id_diferente
APP_ENV=staging
```

**Carregamento automático:**
```javascript
// src/core/index.js linha 1
const envFile = process.env.APP_ENV === 'staging' ? '.env.staging' : '.env';
require('dotenv').config({ path: envFile });
```

## Padrões de Código

### ✅ Bom

```javascript
// Usa utilitário para I/O
const { saveJsonFile } = require('../utils/file-handler');
const poll = { id: 1, name: 'Book choice' };
saveJsonFile('active-polls.json', polls);
```

### ❌ Ruim

```javascript
// I/O direto sem validação
fs.writeFileSync('./data/something.json', JSON.stringify(data));
```

### ✅ Bom

```javascript
// Valida antes de usar
const { validatePollInput } = require('../utils/validators');
if (!validatePollInput(req.data)) {
  return interaction.reply('Invalid poll data');
}
```

### ❌ Ruim

```javascript
// Input não validado
const poll = { name: req.name }; // Pode ser undefined!
```

## Testando Componentes

### Teste Unitário (1 componente isolado)

```javascript
// tests/unit/utils/validators.test.js
const { validatePollInput } = require('../../../src/utils/validators');

describe('validatePollInput', () => {
  test('should reject empty name', () => {
    expect(validatePollInput({ name: '' })).toBe(false);
  });
  
  test('should accept valid input', () => {
    expect(validatePollInput({ name: 'Pick a book' })).toBe(true);
  });
});
```

### Rodar Testes

```bash
npm test                    # Todos
npm run test:watch          # Watch mode
npm run test:coverage       # Com cobertura
```

## Adicionando Nova Feature

**Checklist:**

1. **Criar novo comando**
   ```
   src/commands/{domínio}/novo-comando.js
   ```

2. **Testar entrada**
   ```
   src/utils/validators.js → adicionar rule
   ```

3. **Verificar permissão (se necessário)**
   ```
   src/utils/permissions.js → adicionar check
   ```

4. **Persistir dados (se necessário)**
   ```
   src/utils/file-handler.js → usar saveJsonFile()
   ```

5. **Adicionar testes**
   ```
   tests/unit/utils/seu-tópico.test.js
   tests/unit/commands/{domínio}/novo-comando.test.js
   ```

6. **Rodar validações**
   ```bash
   npm test
   npm run lint
   npm run format
   ```

7. **Criar PR**
   ```
   feature/seu-novo-comando
   ```

## Decisões Arquiteturais

| Decisão | Razão |
|---------|-------|
| Estrutura por domínio | Reduz conflitos em PRs simultâneas |
| Utils centralizados | Evita duplicação de lógica |
| JSON como persistência | Simples, versionável no Git |
| Em memória (activePolls) | Rápido acesso durante votação |
| Dois ambientes isolados | Staging para testes sem afetar prod |
| Jest para testes | Padrão Node.js, sintaxe clara |

---

**Pronto para contribuir?** Vá para [GIT-WORKFLOW.md](GIT-WORKFLOW.md) e crie sua feature! 🚀
