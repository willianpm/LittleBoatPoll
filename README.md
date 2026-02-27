# LittleBoatPoll

Um bot de Discord feito especialmente e sob medida para o canal de Discord Tripulação de Papel, com sistema de votações ponderadas para escolhas do clube do livro.

## Permissões

Sistema binário **interno** para permissões administrativas:

- **Criador de Enquetes**: Usuários adicionados internamente com `/criador-de-enquete adicionar`
- **Administrador e dono do servidor**: acesso total automático
- **Usuário comum**: apenas vota por reações

Não existem níveis intermediários para permissões administrativas. O sistema é gerenciado internamente pelo bot.

### Mensalistas por cargo do servidor

O bot também faz vínculo automático do cargo **Mensalistas** (nome do cargo no Discord) com o papel interno de mensalista:

- Se o cargo existir, qualquer membro com esse cargo é reconhecido como mensalista automaticamente.
- Não é necessário criar um novo cargo se **Mensalistas** já existir no servidor.
- O vínculo é salvo em `role-bindings.json` para persistir entre reinícios.
- Se o cargo não existir, o bot mantém o comportamento padrão atual (lista manual em `mensalistas.json`).

### Gerenciar Criadores

```bash
/criador-de-enquete adicionar adicionar @usuario   # Adiciona permissão administrativa
/criador-de-enquete adicionar remover @usuario     # Remove permissão
/criador-de-enquete adicionar listar               # Lista todos os criadores
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

## Testes

O projeto conta com testes automatizados usando Jest, cobrindo 100% dos módulos utilitários.

### Executar testes

```bash
npm test              # Executa todos os testes
npm run test:watch    # Executa em modo watch (re-executa ao salvar)
npm run test:coverage # Exibe relatório de cobertura de código
```

### Cobertura atual

- ✅ `utils/validators.js` - Validação de enquetes e opções
- ✅ `utils/draft-handler.js` - Manipulação de rascunhos
- ✅ `utils/constants.js` - Constantes do sistema

**59 testes** executando em ~1.3s com meta de 70% de cobertura.
