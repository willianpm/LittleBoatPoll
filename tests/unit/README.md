# Testes Automatizados

Este diretório contém os testes automatizados do LittleBoatPoll usando Jest.

## 📁 Estrutura

```
tests/
├── validators.test.js     - Testes de validação de enquetes
├── draft-handler.test.js  - Testes de manipulação de rascunhos
└── constants.test.js      - Testes de constantes do sistema
```

## 🚀 Executando os Testes

### Executar todos os testes

```bash
npm test
```

### Executar em modo watch (re-executa ao salvar)

```bash
npm run test:watch
```

### Executar com cobertura de código

```bash
npm run test:coverage
```

## ✅ Cobertura Atual

Os testes cobrem:

- ✅ `utils/validators.js` - 100% de cobertura
- ✅ `utils/draft-handler.js` - 100% de cobertura
- ✅ `utils/constants.js` - 100% de cobertura

## 📝 Escrevendo Novos Testes

Para adicionar novos testes, crie um arquivo `*.test.js` neste diretório seguindo o padrão:

```javascript
const { minhaFuncao } = require('../utils/meu-modulo');

describe('meu-modulo - minhaFuncao', () => {
  test('deve fazer algo específico', () => {
    const result = minhaFuncao('input');
    expect(result).toBe('expected');
  });
});
```

## 🎯 Metas de Cobertura

O projeto mantém meta de 70% de cobertura de código para:

- Branches (ramificações)
- Functions (funções)
- Lines (linhas)
- Statements (declarações)

## 📚 Documentação do Jest

Para mais informações sobre Jest: https://jestjs.io/docs/getting-started
