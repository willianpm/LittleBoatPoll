// Serviço para escrita segura de JSON para o bot
// Contrato: savePoll(jsonData) => Promise<void>

const fs = require('fs/promises');
const path = require('path');

/**
 * Salva dados no formato JSON esperado pelo bot
 * @param {any} jsonData Dados já validados e convertidos
 * @returns {Promise<void>}
 */
async function savePoll(jsonData) {
  const targetPath = path.resolve(__dirname, '../../data/environments/staging/draft-polls.json');
  try {
    console.log(`[botService] Salvando JSON em: ${targetPath}`);
    await fs.writeFile(targetPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log('[botService] JSON salvo com sucesso.');
  } catch (err) {
    console.error(`[botService] Erro ao salvar JSON: ${err.message}`);
    throw err;
  }
}

module.exports = { savePoll };
