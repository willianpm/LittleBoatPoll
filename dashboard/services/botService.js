// Serviço para escrita segura de JSON para o bot
// Contrato: savePoll(jsonData) => Promise<void>

const fs = require('fs/promises');

/**
 * Salva dados no formato JSON esperado pelo bot
 * Usa configuração de ambiente via config.js
 * Import da config é lazy-loaded para facilitar testes
 * @param {any} jsonData Dados já validados e convertidos
 * @returns {Promise<void>}
 */
async function savePoll(jsonData) {
  // Lazy-load da config para evitar erro em testes
  const { DATA_FILES } = require('../../src/utils/config');
  const targetPath = DATA_FILES.draftPolls;
  try {
    console.log(`[botService] Salvando JSON em: ${targetPath}`);
    console.log(`[botService] Ambiente: ${process.env.APP_ENV || 'prod'}`);
    await fs.writeFile(targetPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log('[botService] JSON salvo com sucesso.');
  } catch (err) {
    console.error(`[botService] Erro ao salvar JSON: ${err.message}`);
    throw err;
  }
}

module.exports = { savePoll };
