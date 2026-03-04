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

## 2. Teste de Integração Simples

Crie um script de integração para simular upload e processamento:

```js
// dashboard/integrationTest.js
const csvService = require('./services/csvService'); // ou .mock
const botService = require('./services/botService'); // ou .mock

(async () => {
  const result = await csvService.parseAndValidate('caminho/do/arquivo.csv');
  if (result.valid) {
    await botService.savePoll(result.data);
    console.log('Integração concluída com sucesso!');
  } else {
    console.error('Erro:', result.error);
  }
})();
```

Execute:

```bash
node dashboard/integrationTest.js
```

---

Com isso, você pode alternar facilmente entre mocks e serviços reais, garantindo desenvolvimento paralelo, testes isolados e integração segura com o Dashboard (#15).
