# Guia de Integração: Alternando entre Mocks e Serviços Reais

Este documento explica como alternar entre os mocks e os serviços reais do backend do Dashboard, facilitando desenvolvimento paralelo e testes isolados.

## 1. Estrutura dos Serviços

- **Serviços reais:**
  - `services/csvService.js`
  - `services/botService.js`
- **Mocks:**
  - `services/csvService.mock.js`
  - `services/botService.mock.js`

## 2. Como Alternar

### Manualmente no código

Troque o import do serviço real pelo mock conforme necessidade:

```js
// Para usar o serviço real:
const csvService = require('../services/csvService');
const botService = require('../services/botService');

// Para usar o mock:
const csvService = require('../services/csvService.mock');
const botService = require('../services/botService.mock');
```

### Com variável de ambiente

Utilize uma variável de ambiente para alternar automaticamente:

```js
// Exemplo em controllers/csvController.js
const useMock = process.env.USE_MOCK === 'true';
const csvService = useMock ? require('../services/csvService.mock') : require('../services/csvService');
const botService = useMock ? require('../services/botService.mock') : require('../services/botService');
```

Execute com mock:

```bash
USE_MOCK=true node dashboard/controllers/csvController.js
```

## 3. Recomendações

- Use mocks para desenvolvimento isolado, testes automatizados e integração paralela.
- Troque para serviços reais quando o Dashboard (#15) estiver finalizado ou para testes de integração completos.
- Documente sempre qual serviço está sendo utilizado para evitar confusões.

## 4. Exemplos de Teste

### Teste com serviço real

```js
const { parseAndValidate } = require('../services/csvService');
const { savePoll } = require('../services/botService');
// ...testes reais
```

### Teste com mock

```js
const { parseAndValidate } = require('../services/csvService.mock');
const { savePoll } = require('../services/botService.mock');
// ...testes simulados
```

---

# Scripts de Teste e Integração

## 1. Rodando todos os testes

Adicione ao seu `package.json`:

```json
"scripts": {
  "test:dashboard": "jest dashboard/services/*.test.js dashboard/controllers/*.test.js"
}
```

Execute:

```bash
npm run test:dashboard
```

## 2. Teste de Integração Simples (Importação de Enquetes via CSV)

O script `dashboard/integrationTest.js` agora suporta importação de múltiplas enquetes via CSV, reaproveitando todas as validações e regras do comando `/enquete`.

**Fluxo atualizado:**

1. O CSV deve conter as colunas obrigatórias: `nome-da-enquete`, `opções`, `max_votos`, `peso_mensalistas` (separadas por ponto e vírgula `;`).
2. Cada linha é convertida para a estrutura interna de enquete.
3. Para cada linha:
   - Os dados são validados usando as mesmas funções do comando `/enquete` (`validatePollOptions`, `parseOptions`).
   - Apenas enquetes válidas são salvas.
   - Linhas inválidas são reportadas com o motivo do erro.
4. Ao final, o script informa:
   - Quantas enquetes foram criadas com sucesso
   - Quais linhas falharam e por qual motivo

**Exemplo de uso:**

```js
const useMock = process.env.USE_MOCK === 'true';
const csvService = useMock ? require('./services/csvService.mock') : require('./services/csvService');
const botService = useMock ? require('./services/botService.mock') : require('./services/botService');
const { validatePollOptions, parseOptions } = require('../src/utils/validators');

(async () => {
  const csvPath = useMock ? 'mock.csv' : './services/test.csv';
  const result = await csvService.parseAndValidate(csvPath);
  let sucesso = 0;
  let falhas = [];
  let criadas = [];
  if (result.valid && Array.isArray(result.data)) {
    for (let i = 0; i < result.data.length; i++) {
      const linha = result.data[i];
      const opcoes = Array.isArray(linha.opcoes)
        ? linha.opcoes
        : parseOptions(Array.isArray(linha.opcoes) ? linha.opcoes.join(',') : linha.opcoes);
      const validation = validatePollOptions(opcoes, linha.maxVotos);
      if (!validation.valid) {
        falhas.push({ linha: i + 2, motivo: validation.error });
        continue;
      }
      const dto = {
        titulo: linha.titulo || linha['nome-da-enquete'],
        opcoes,
        maxVotos: linha.maxVotos,
        usarPesoMensalista: linha.usarPesoMensalista,
        status: 'rascunho',
        criadoEm: linha.criadoEm || new Date().toISOString(),
        editadoEm: linha.editadoEm || new Date().toISOString(),
      };
      criadas.push(dto);
      sucesso++;
    }
    if (criadas.length) {
      await botService.savePoll(criadas);
    }
    console.log(`Enquetes criadas com sucesso: ${sucesso}`);
    if (falhas.length) {
      console.log('Falhas:');
      falhas.forEach((f) => console.log(`Linha ${f.linha}: ${f.motivo}`));
    }
  } else {
    console.error('Erro:', result.error);
  }
})();
```

Execute:

```bash
node dashboard/integrationTest.js
```

**Resumo das melhorias:**

- Validação de colunas e tipos do CSV
- Reaproveitamento das regras do comando `/enquete` (sem duplicação de lógica)
- Feedback detalhado ao usuário sobre sucesso e falhas

---

# Integração de Comandos do Bot via Dashboard

## Endpoint HTTP

- **URL:** `/api/commands/:commandName`
- **Método:** `POST`
- **Exemplo:** `/api/commands/poll`

## Autenticação

- **Header:** `Authorization: Bearer <token>`
- O token deve ser obtido pelo fluxo de login do dashboard (feature #15).

## Payload da Requisição

```json
{
  "options": { /* argumentos do comando */ },
  "user": { "id": "...", "username": "..." },
  "guild": { "id": "...", "name": "..." },
  "member": { "id": "...", "roles": ["..."], ... },
  "permissions": ["...", "..."]
}
```

### Diagrama do Payload

```
{
  options: { ... },
  user: {
    id: string,
    username: string,
    ...
  },
  guild: {
    id: string,
    name: string,
    ...
  },
  member: {
    id: string,
    roles: string[],
    ...
  },
  permissions: string[]
}
```

## Resposta

- Formato igual ao que o bot retornaria no Discord (objeto com `content`, `embeds`, etc).
- Em caso de erro, retorna `{ error: "mensagem" }` e status HTTP apropriado.

## Regras de Negócio

- O comando só será executado se:
  - O bot estiver presente na guild informada.
  - O usuário tiver permissão para executar o comando.
- O backend valida permissões e contexto.

## Teste de Integração

- Teste disponível em `dashboard/tests/dashboard-commands.test.js` como referência de uso.

---

Com isso, você pode alternar facilmente entre mocks e serviços reais, garantindo desenvolvimento paralelo, testes isolados e integração segura com o Dashboard (#15).
