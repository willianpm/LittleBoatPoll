# LittleBoatPoll

Um bot de Discord feito especialmente e sob medida para o canal de Discord Tripulação de Papel, com sistema de votações ponderadas para escolhas do clube do livro.

## Permissões

Sistema binário **interno** para permissões administrativas:

- **Criador de Enquetes**: Usuários adicionados internamente com `/criador-de-enquete adicionar`
- **Cargo autorizado por servidor (opcional)**: cargos cadastrados em `role-bindings.json` dentro de `adminRoleIdsByGuild`
- **Administrador e dono do servidor**: acesso total automático
- **Usuário comum**: apenas vota por reações

Não existem níveis intermediários para permissões administrativas. O sistema é gerenciado internamente pelo bot.

### Autorização administrativa remota por cargo (JSON)

Se você quiser autorizar um cargo do Discord sem usar comando, edite o arquivo do ambiente em uso:

- Produção: `data/prod/role-bindings.json`
- Staging: `data/staging/role-bindings.json`

**Como encontrar os IDs:**

1. **ID do servidor (Guild ID):**
   - Abra o servidor Discord
   - Clique com botão direito no nome do servidor (canto superior esquerdo)
   - Selecione "Copiar ID do Servidor"

2. **ID do cargo (Role ID):**
   - Ative "Modo Desenvolvedor" em Discord (User Settings → App Settings → Developer Mode)
   - Abra Configurações do Servidor → Cargos
   - Clique com botão direito no cargo desejado
   - Selecione "Copiar ID do Role"

**Estrutura do arquivo:**

```json
{
	"mensalistaRoleByGuild": {
		"771368260633362473": "1476256860293304330"
	},
	"adminRoleIdsByGuild": {
		"771368260633362473": ["123456789012345678", "987654321098765432"]
	}
}
```

- **adminRoleIdsByGuild**: objeto onde a chave é `guildId` e o valor é uma lista de IDs de cargos.
- Membros com qualquer um desses cargos terão **acesso administrativo total** ao bot.
- Mudança é aplicada na próxima interação (não exige reinicialização).
- Veja os comentários no arquivo `role-bindings.json` para instruções detalhadas.

### Mensalistas por cargo do servidor

O bot também faz vínculo automático do cargo **Mensalistas** (nome do cargo no Discord) com o papel interno de mensalista:

- Se o cargo existir, qualquer membro com esse cargo é reconhecido como mensalista automaticamente.
- Não é necessário criar um novo cargo se **Mensalistas** já existir no servidor.
- O vínculo é salvo em `role-bindings.json` para persistir entre reinícios.
- Se o cargo não existir, o bot mantém o comportamento padrão atual (lista manual em `mensalistas.json`).

### Gerenciar Criadores

```bash
/criador-de-enquete adicionar @usuario   # Adiciona permissão administrativa
/criador-de-enquete remover @usuario     # Remove permissão
/criador-de-enquete listar               # Lista todos os criadores
```

Ou use o **Context Menu** (botão direito no usuário → Apps → "Add/Del Criador de Enquetes")

📖 **Leia mais:** [Documentação de Migração](docs/MIGRACAO-PERMISSOES-INTERNAS.md)

## Requisitos

- Node.js >= 22
- npm
- Token do bot e client ID

## Instalação

```bash
npm install
```

Crie o arquivo `.env`:

```env
TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
```

## Executar

```bash
npm start
```

Registrar comandos manualmente:

```bash
npm run deploy
```

Registrar comandos automaticamente na inicialização:

```env
DEPLOY=true
```

## 🧪 Bot de Homologação (Staging)

O projeto suporta execução em dois ambientes isolados:

- **Produção** (`APP_ENV=prod`) - Bot principal com dados em `data/prod/`
- **Staging** (`APP_ENV=staging`) - Bot de testes com dados em `data/staging/`

### Executar bot de staging

**Todas as plataformas (Windows/Linux/Mac):**

```bash
npm run start:staging
```

**Ou manualmente:**

Windows (PowerShell):

```powershell
$env:APP_ENV="staging"; npm start
```

Linux/Mac:

```bash
APP_ENV=staging npm start
```

O bot de staging permite validar funcionalidades "em loco" (no Discord real) sem afetar produção:

- ✅ Mesmo código-fonte, zero duplicação
- ✅ Dados completamente isolados por ambiente
- ✅ Token/Client ID próprios (crie segundo bot no Discord Developer Portal)
- ✅ Execução sob demanda, apenas quando necessário

📖 **Guia completo:** [Bot de Homologação](docs/staging-bot.md)

## Testes

### Testes Unitários

Cobertura automática de 100% dos módulos utilitários usando Jest:

```bash
npm test              # Executa todos os testes unitários
npm run test:watch    # Modo watch (re-executa ao salvar)
npm run test:coverage # Relatório de cobertura de código
```

**Módulos testados:**

- `utils/validators.js` - Validação de enquetes e opções
- `utils/draft-handler.js` - Manipulação de rascunhos
- `utils/constants.js` - Constantes do sistema
- `utils/mensalista-binding.js` - Vínculo automático de mensalistas

### Testes de Integração (Automatizados)

Suite que simula usuários reais interagindo com o bot staging, validando funcionalidades fim-a-fim:

```bash
npm run test:full     # Forma recomendada (inicia bot, testa, para bot)
```

**Ou manualmente (2 terminais):**

```bash
npm run start:staging # Terminal 1: Inicia bot staging
npm run test:automation # Terminal 2: Executa testes
```

Cenários validados:

- ✅ Criação de enquetes
- ✅ Votação (adicionar/remover votos)
- ✅ Limites de votação e reações
- ✅ Permissões administrativas

📖 **Documentação completa:** [Testes Automatizados](test-bot/AUTOMATION.md)
