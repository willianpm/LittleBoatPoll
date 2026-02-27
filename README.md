# LittleBoatPoll

Um bot de Discord feito especialmente e sob medida para o canal de Discord Tripulação de Papel, com sistema de votações ponderadas para escolhas do clube do livro.

## Permissões

Sistema binário:

- Criador: acesso total
- Administrador e dono do servidor: acesso total
- Usuário comum: apenas vota por reações

Não existem níveis intermediários. Para ocultar comandos de usuários comuns, restrinja os comandos nas integrações do Discord.

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
