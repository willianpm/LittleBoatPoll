// Serviço para parsing, validação e conversão de CSV para JSON
// Contrato: parseAndValidate(filePath) => { valid, data, error }

const fs = require('fs/promises');
const csv = require('csv-parse/sync');
const crypto = require('crypto');
const { validatePollOptions } = require('../../src/utils/validators');

/**
 * Verifica se um valor começa com caracteres perigosos (CSV Injection)
 * @param {string} value Valor a verificar
 * @returns {boolean} true se o valor contém injeção
 */
function containsCSVInjection(value) {
  if (!value || typeof value !== 'string') return false;
  const firstChar = value.trim().charAt(0);
  return ['=', '+', '-', '@'].includes(firstChar);
}

/**
 * Valida todos os valores do CSV contra CSV Injection
 * @param {Array} records Array de registros parseados
 * @returns {{valid: boolean, error?: string}} Resultado da validação
 */
function validateAgainstCSVInjection(records) {
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    for (const [key, value] of Object.entries(row)) {
      if (containsCSVInjection(value)) {
        return {
          valid: false,
          error: `Linha ${i + 2}, coluna "${key}": valor suspeito detectado. Células não podem começar com =, +, -, ou @`,
        };
      }
    }
  }
  return { valid: true };
}

/**
 * Lê, valida e converte CSV para JSON compatível com o bot
 * @param {string} filePath Caminho do arquivo CSV
 * @returns {Promise<{valid: boolean, data?: any, error?: string}>}
 */
async function parseAndValidate(filePath, context = {}) {
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
    // Validar contra CSV Injection
    const injectionCheck = validateAgainstCSVInjection(records);
    if (!injectionCheck.valid) {
      console.error(`[csvService] Erro: CSV Injection detectado - ${injectionCheck.error}`);
      return { valid: false, error: injectionCheck.error };
    }
    // Colunas obrigatórias
    const requiredColumns = ['nome-da-enquete', 'opcoes (ou opções)', 'max_votos (ou maxVotos)', 'peso_mensalistas'];
    const csvColumns = Object.keys(records[0] || {});
    const hasNome = csvColumns.includes('nome-da-enquete');
    const hasOpcoes = csvColumns.includes('opções') || csvColumns.includes('opcoes');
    const hasMaxVotos = csvColumns.includes('max_votos') || csvColumns.includes('maxVotos');
    const hasPesoMensalistas = csvColumns.includes('peso_mensalistas');
    const hasExactCount = csvColumns.length === requiredColumns.length;
    if (!hasExactCount || !hasNome || !hasOpcoes || !hasMaxVotos || !hasPesoMensalistas) {
      console.error('[csvService] Erro: Colunas obrigatórias ausentes ou incorretas.');
      return {
        valid: false,
        error: `CSV deve conter exatamente 4 colunas separadas por ";": nome-da-enquete, opcoes, max_votos, peso_mensalistas. Colunas encontradas: ${csvColumns.join(', ') || '(nenhuma)'}`,
      };
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
      // Converte maxVotos para número antes de validar com regras compartilhadas
      const maxVotos = Number(maxVotosRaw);
      // opções separadas por vírgula, barra ou pipe
      let opcoes = Array.isArray(opcoesRaw)
        ? opcoesRaw
        : String(opcoesRaw)
            .split(/[,\|/]/)
            .map((op) => op.trim())
            .filter((op) => op.length > 0);

      // Reutiliza validação oficial do domínio para evitar divergência com o bot
      const validation = validatePollOptions(opcoes, maxVotos);
      if (!validation.valid) {
        return { valid: false, error: `Linha ${i + 2}: ${validation.error}` };
      }
      // peso_mensalistas: sim/nao
      const usarPesoMensalista = String(row['peso_mensalistas']).toLowerCase() === 'sim';
      // Monta estrutura interna
      mappedPolls.push({
        id: crypto.randomBytes(4).toString('hex').toUpperCase(),
        titulo: row['nome-da-enquete'],
        opcoes,
        maxVotos,
        usarPesoMensalista,
        criadorId: context.userId || null,
        criadorNome: context.username || 'dashboard-csv',
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
