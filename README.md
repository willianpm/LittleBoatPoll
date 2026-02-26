# LittleBoatPoll

LittleBoatPoll é um bot do Discord para votações em clubes do livro, com votos ponderados.

## Permissões

Sistema binário:

- Criador: acesso total
- Administrador e dono do servidor: acesso total
- Usuário comum: apenas vota por reações

Não existem níveis intermediários. Para ocultar comandos de usuários comuns, restrinja os comandos nas integrações do Discord.

## Requisitos

- Node.js >= 24
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
