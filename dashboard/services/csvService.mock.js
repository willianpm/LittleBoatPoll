// Mock para parseAndValidate: simula parsing de CSV sem ler arquivos reais
// Útil para testes isolados e integração paralela

/**
 * Mock da função parseAndValidate
 * @param {string} filePath Caminho do arquivo CSV (ignorado no mock)
 * @returns {Promise<{valid: boolean, data?: any, error?: string}>}
 */
async function parseAndValidate(filePath) {
  console.log('[csvService.mock] Simulando parsing de CSV:', filePath);
  // Simula dados válidos
  return {
    valid: true,
    data: [
      { id: '1', name: 'Ana' },
      { id: '2', name: 'João' },
    ],
  };
}

module.exports = { parseAndValidate };
