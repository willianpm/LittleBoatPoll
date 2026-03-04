// Serviço para parsing, validação e conversão de CSV para JSON
// Contrato: parseAndValidate(filePath) => { valid, data, error }

const fs = require('fs/promises');
const path = require('path');
const csv = require('csv-parse/sync'); // Instalar depois: npm install csv-parse

/**
 * Lê, valida e converte CSV para JSON compatível com o bot
 * @param {string} filePath Caminho do arquivo CSV
 * @returns {Promise<{valid: boolean, data?: any, error?: string}>}
 */
async function parseAndValidate(filePath) {
  try {
    console.log(`[csvService] Lendo arquivo CSV: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8');
    const records = csv.parse(content, { columns: true, skip_empty_lines: true });
    if (!records.length) {
      console.error('[csvService] Erro: Arquivo CSV vazio.');
      return { valid: false, error: 'Arquivo CSV vazio.' };
    }
    // TODO: Adicionar validações específicas do bot
    console.log(`[csvService] CSV processado com sucesso. Registros: ${records.length}`);
    return { valid: true, data: records };
  } catch (err) {
    console.error(`[csvService] Erro ao processar CSV: ${err.message}`);
    return { valid: false, error: err.message };
  }
}

module.exports = { parseAndValidate };
