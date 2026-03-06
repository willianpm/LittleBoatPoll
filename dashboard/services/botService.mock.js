// Mock para savePoll: simula escrita sem alterar arquivos reais
// Útil para testes isolados e integração paralela

/**
 * Mock da função savePoll
 * @param {any} jsonData Dados já validados e convertidos
 * @returns {Promise<void>}
 */
async function savePoll(jsonData) {
  console.log('[botService.mock] Dados recebidos para salvar:', JSON.stringify(jsonData, null, 2));
  // Simula delay de escrita
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log('[botService.mock] Mock de escrita concluído. Nenhum arquivo foi alterado.');
}

module.exports = { savePoll };
