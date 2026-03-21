// Serviço para escrita segura de JSON para o bot
// Contrato: savePoll(jsonData) => Promise<void>

const fs = require('fs/promises');
const crypto = require('crypto');
const { client } = require('../../src/core/client');

function normalizeUsarPesoMensalista(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['sim', 'true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }

    if (['nao', 'não', 'false', '0', 'no', 'n', ''].includes(normalized)) {
      return false;
    }
  }

  return false;
}

function normalizeDraft(draft) {
  const now = new Date().toISOString();
  return {
    id: draft.id || crypto.randomBytes(4).toString('hex').toUpperCase(),
    titulo: draft.titulo || 'Sem título',
    opcoes: Array.isArray(draft.opcoes) ? draft.opcoes : [],
    maxVotos: Number.isFinite(Number(draft.maxVotos)) ? Number(draft.maxVotos) : 1,
    usarPesoMensalista: normalizeUsarPesoMensalista(draft.usarPesoMensalista),
    criadorId: draft.criadorId || null,
    criadorNome: draft.criadorNome || 'dashboard-csv',
    status: 'rascunho',
    criadoEm: draft.criadoEm || now,
    editadoEm: draft.editadoEm || now,
  };
}

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
  const drafts = (Array.isArray(jsonData) ? jsonData : []).map(normalizeDraft);

  try {
    console.log(`[botService] Salvando JSON em: ${targetPath}`);
    console.log(`[botService] Ambiente: ${process.env.APP_ENV || 'prod'}`);
    await fs.writeFile(targetPath, JSON.stringify(drafts, null, 2), 'utf-8');

    // Mantém memória do bot sincronizada sem precisar restart.
    client.draftPolls = new Map(drafts.map((draft) => [draft.id, draft]));

    console.log('[botService] JSON salvo com sucesso.');
  } catch (err) {
    console.error(`[botService] Erro ao salvar JSON: ${err.message}`);
    throw err;
  }
}

module.exports = { savePoll };
