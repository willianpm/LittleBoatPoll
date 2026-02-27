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

Não há testes automatizados. O script `test` registra comandos e inicia o bot:

```bash
npm test
```
