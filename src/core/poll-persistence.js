const fs = require('fs');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { loadJsonFile, saveJsonFile, ensureDataFiles } = require('../utils/file-handler');
const { DEFAULT_DURATION_KEY, calculateEndsAt, isValidDurationKey } = require('../utils/poll-duration');
const { normalizeDraftOptions } = require('../utils/draft-option-normalizer');

let activeClient = null;

function saveActivePolls() {
  try {
    const pollsArray = Array.from(activeClient.activePolls.entries());
    saveJsonFile(config.DATA_FILES.activePolls, pollsArray);
  } catch (error) {
    logger.error(`Erro ao salvar votações ativas: ${error.message}`);
  }
}

function saveDraftPolls() {
  try {
    const draftsArray = Array.from(activeClient.draftPolls.values());
    saveJsonFile(config.DATA_FILES.draftPolls, draftsArray);
  } catch (error) {
    logger.error(`Erro ao salvar rascunhos: ${error.message}`);
  }
}

function loadActivePolls() {
  try {
    if (fs.existsSync(config.DATA_FILES.activePolls)) {
      const pollsArray = loadJsonFile(config.DATA_FILES.activePolls, []);

      const normalizedPolls = pollsArray.map(([id, poll]) => {
        const durationKey = isValidDurationKey(poll.durationKey) ? poll.durationKey : DEFAULT_DURATION_KEY;
        const createdAtRef = poll.criadoEm || poll.createdAt || null;
        return [
          id,
          {
            ...poll,
            channelId: poll.channelId || null,
            maxVotos: poll.maxVotos || 1,
            usarPesoMensalista: poll.usarPesoMensalista !== undefined ? poll.usarPesoMensalista : false,
            durationKey,
            endsAt: poll.endsAt || calculateEndsAt(createdAtRef, durationKey, DEFAULT_DURATION_KEY),
            votos: poll.votos || {},
            status: poll.status || 'ativa',
          },
        ];
      });

      activeClient.activePolls = new Map(normalizedPolls);
      logger.info(`${normalizedPolls.length} votação(ões) ativa(s) carregada(s)`);
    }
  } catch (error) {
    logger.error(`Erro ao carregar votações ativas: ${error.message}`);
  }
}

function loadDraftPolls() {
  try {
    if (fs.existsSync(config.DATA_FILES.draftPolls)) {
      const draftsArray = loadJsonFile(config.DATA_FILES.draftPolls, []);

      const agora = Date.now();
      const LIMITE_MS = 90 * 24 * 60 * 60 * 1000;
      let removidos = 0;

      const draftsFiltrados = draftsArray.filter((draft) => {
        const dataRef = draft.editadoEm || draft.criadoEm;
        if (!dataRef) return true;
        const diff = agora - new Date(dataRef).getTime();
        if (diff > LIMITE_MS) {
          removidos++;
          return false;
        }
        return true;
      });

      const normalizedDrafts = draftsFiltrados.map((draft) => {
        const normalizedOptions = normalizeDraftOptions(draft.opcoes);

        return [
          draft.id,
          {
            ...draft,
            opcoes: normalizedOptions,
            maxVotos: draft.maxVotos || 1,
            usarPesoMensalista: draft.usarPesoMensalista !== undefined ? draft.usarPesoMensalista : false,
            criadorId: draft.criadorId || null,
            criadoEm: draft.criadoEm || new Date().toISOString(),
            editadoEm: draft.editadoEm || new Date().toISOString(),
          },
        ];
      });

      activeClient.draftPolls = new Map(normalizedDrafts);
      if (removidos > 0) {
        const draftsToSave = Array.from(activeClient.draftPolls.values());
        saveJsonFile(config.DATA_FILES.draftPolls, draftsToSave);
        logger.info(`Limpeza automática: ${removidos} rascunho(s) antigo(s) removido(s) (90+ dias)`);
      }
      logger.info(`${normalizedDrafts.length} rascunho(s) de enquete(s) carregado(s)`);
    }
  } catch (error) {
    logger.error(`Erro ao carregar rascunhos: ${error.message}`);
  }
}

function initDataFiles() {
  ensureDataFiles();
}

function attachToClient(client) {
  activeClient = client;
  client.saveActivePolls = saveActivePolls;
  client.saveDraftPolls = saveDraftPolls;
}

function init() {
  initDataFiles();
  loadActivePolls();
  loadDraftPolls();
}

module.exports = {
  attachToClient,
  init,
  saveActivePolls,
  saveDraftPolls,
  loadActivePolls,
  loadDraftPolls,
};
