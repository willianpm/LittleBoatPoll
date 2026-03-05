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
    // Configura parser para ; como delimitador
    let records;
    try {
      records = csv.parse(content, { columns: true, skip_empty_lines: true, delimiter: ';' });
    } catch (parseErr) {
      console.error(`[csvService] Erro de parsing CSV: ${parseErr.message}`);
      return { valid: false, error: 'Erro ao ler o CSV: formato inválido ou delimitador incorreto.' };
    }
    if (!records.length) {
      console.error('[csvService] Erro: Arquivo CSV vazio.');
      return { valid: false, error: 'Arquivo CSV vazio.' };
    }
    // Colunas obrigatórias
    const requiredColumns = ['nome-da-enquete', 'opções', 'max_votos', 'peso_mensalistas'];
    const csvColumns = Object.keys(records[0] || {});
    if (csvColumns.length !== requiredColumns.length || !requiredColumns.every((col) => csvColumns.includes(col))) {
      console.error('[csvService] Erro: Colunas obrigatórias ausentes ou incorretas.');
      return { valid: false, error: `CSV deve conter exatamente as colunas: ${requiredColumns.join(', ')}` };
    }
    // Mapeia cada linha para estrutura interna
    const mappedPolls = [];
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      // Validação de tipos
      // Aceita tanto 'opcoes' quanto 'opções' (com acento)
      const opcoesRaw = row['opcoes'] || row['opções'];
      const maxVotosRaw = row['maxVotos'] || row['max_votos'];
      if (!row['nome-da-enquete'] || !opcoesRaw || !maxVotosRaw || !row['peso_mensalistas']) {
        return { valid: false, error: `Linha ${i + 2}: campos obrigatórios ausentes.` };
      }
      // maxVotos deve ser numérico
      const maxVotos = Number(maxVotosRaw);
      if (!Number.isInteger(maxVotos) || maxVotos < 1) {
        return { valid: false, error: `Linha ${i + 2}: max_votos deve ser um número inteiro positivo.` };
      }
      // opções separadas por vírgula ou barra
      let opcoes = Array.isArray(opcoesRaw)
        ? opcoesRaw
        : String(opcoesRaw)
            .split(/[,|\|]/)
            .map((op) => op.trim())
            .filter((op) => op.length > 0);
      // Validação de opções
      if (opcoes.length < 2) {
        return { valid: false, error: `Linha ${i + 2}: mínimo 2 opções.` };
      }
      if (opcoes.length > 20) {
        return { valid: false, error: `Linha ${i + 2}: máximo 20 opções.` };
      }
      // peso_mensalistas: sim/nao
      const usarPesoMensalista = String(row['peso_mensalistas']).toLowerCase() === 'sim';
      // Monta estrutura interna
      mappedPolls.push({
        titulo: row['nome-da-enquete'],
        opcoes,
        maxVotos,
        usarPesoMensalista,
        status: 'rascunho',
        criadoEm: new Date().toISOString(),
        editadoEm: new Date().toISOString(),
      });
    }
    console.log(`[csvService] CSV processado com sucesso. Registros: ${mappedPolls.length}`);
    return { valid: true, data: mappedPolls };
  } catch (err) {
    console.error(`[csvService] Erro ao processar CSV: ${err.message}`);
    return { valid: false, error: err.message };
  }
}

module.exports = { parseAndValidate };
