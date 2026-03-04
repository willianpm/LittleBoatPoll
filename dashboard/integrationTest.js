// Script de integração simples para backend do Dashboard
// Permite alternar entre mocks e serviços reais

const useMock = process.env.USE_MOCK === 'true';
const csvService = useMock ? require('./services/csvService.mock') : require('./services/csvService');
const botService = useMock ? require('./services/botService.mock') : require('./services/botService');

(async () => {
  // Simule o caminho de um arquivo CSV real ou fictício
  const csvPath = useMock ? 'mock.csv' : './services/test.csv';
  const result = await csvService.parseAndValidate(csvPath);
  if (result.valid) {
    await botService.savePoll(result.data);
    console.log('Integração concluída com sucesso!');
  } else {
    console.error('Erro:', result.error);
  }
})();
