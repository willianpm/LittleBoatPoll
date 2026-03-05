// Mock para parseAndValidate: simula parsing de CSV sem ler arquivos reais
// Útil para testes isolados e integração paralela

/**
 * Mock da função parseAndValidate
 * @param {string} filePath Caminho do arquivo CSV (ignorado no mock)
 * @returns {Promise<{valid: boolean, data?: any, error?: string}>}
 */
async function parseAndValidate(filePath) {
  console.log('[csvService.mock] Simulando parsing de CSV:', filePath);
  // Simula dados válidos conforme exemplo do README
  return {
    valid: true,
    data: [
      {
        'nome-da-enquete': 'Melhor filme',
        opções: 'Star Wars,Matrix,Senhor dos Anéis',
        max_votos: 1,
        peso_mensalistas: 'sim',
      },
    ],
  };
}

module.exports = { parseAndValidate };
