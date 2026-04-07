const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { DATA_FILES, DATA_DIR } = require('./config');

const DEFAULT_ROLE_BINDINGS = {
  mensalistaRoleByGuild: {},
};

function normalizeMemberEntry(entry, fallbackAddedBy = null) {
  if (!entry) return null;

  if (typeof entry === 'string') {
    return {
      id: entry,
      addedAt: null,
      addedBy: fallbackAddedBy,
    };
  }

  if (typeof entry === 'object') {
    const id = entry.id || entry.userId || entry.usuarioId;
    if (!id) return null;

    return {
      id: String(id),
      addedAt: entry.addedAt || entry.adicionadoEm || entry.createdAt || entry.criadoEm || null,
      addedBy: entry.addedBy || entry.adicionadoPor || null,
    };
  }

  return null;
}

function normalizeMemberList(data, key, fallbackAddedBy = null) {
  const rawList = Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [];

  return rawList.map((entry) => normalizeMemberEntry(entry, fallbackAddedBy)).filter(Boolean);
}

/**
 * Normaliza estrutura de role-bindings para formato esperado
 * @param {Object} data - Dados brutos carregados do JSON
 * @returns {Object} Estrutura normalizada
 */

function normalizeRoleBindings(data = {}) {
  const mensalistaRoleByGuild =
    data?.mensalistaRoleByGuild && typeof data.mensalistaRoleByGuild === 'object' ? data.mensalistaRoleByGuild : {};

  return {
    mensalistaRoleByGuild,
  };
}

/**
 * Garante que o diretório existe, criando se necessário
 * @param {string} dirPath - Caminho do diretório
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Carrega um arquivo JSON com valor padrão em caso de erro
 * @param {string} filePath - Caminho do arquivo
 * @param {any} defaultValue - Valor padrão se arquivo não existir
 * @returns {any} Dados do JSON ou valor padrão
 */
function loadJsonFile(filePath, defaultValue = {}) {
  try {
    ensureDirectoryExists(path.dirname(filePath));

    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    logger.error(`Erro ao carregar ${filePath}: ${error.message}`, error);
  }
  return defaultValue;
}

/**
 * Salva dados em um arquivo JSON
 * @param {string} filePath - Caminho do arquivo
 * @param {any} data - Dados a salvar
 * @returns {boolean} true se sucesso, false se erro
 */
function saveJsonFile(filePath, data) {
  try {
    ensureDirectoryExists(path.dirname(filePath));

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    logger.error(`Erro ao salvar ${filePath}: ${error.message}`, error);
    return false;
  }
}

/**
 * Carrega a lista de mensalistas
 * @returns {Object} Objeto com array de IDs
 */
function loadMensalistas() {
  const data = loadJsonFile(DATA_FILES.mensalistas, { mensalistas: [] });
  return {
    mensalistas: normalizeMemberList(data, 'mensalistas'),
  };
}

/**
 * Salva a lista de mensalistas
 * @param {Object} data - Dados com array de mensalistas
 * @returns {boolean} true se sucesso
 */
function saveMensalistas(data) {
  const mensalistas = normalizeMemberList(data, 'mensalistas');
  return saveJsonFile(DATA_FILES.mensalistas, { mensalistas });
}

/**
 * Carrega mapeamento de cargos internos por servidor
 * @returns {Object} Objeto com bindings por guild
 */
function loadRoleBindings() {
  const rawBindings = loadJsonFile(DATA_FILES.roleBindings, DEFAULT_ROLE_BINDINGS);
  return normalizeRoleBindings(rawBindings);
}

/**
 * Salva mapeamento de cargos internos por servidor
 * @param {Object} data - Dados de bindings
 * @returns {boolean} true se sucesso
 */
function saveRoleBindings(data) {
  const currentData = loadRoleBindings();
  const nextData = normalizeRoleBindings({
    ...currentData,
    ...(data && typeof data === 'object' ? data : {}),
  });

  return saveJsonFile(DATA_FILES.roleBindings, nextData);
}

/**
 * Carrega lista de criadores internos (IDs de usuários)
 * @returns {Object} Objeto com array de IDs de usuários
 */
function loadCriadores() {
  const data = loadJsonFile(DATA_FILES.criadores, { criadores: [] });
  return {
    criadores: normalizeMemberList(data, 'criadores'),
  };
}

/**
 * Salva lista de criadores internos
 * @param {Object} data - Dados com array de criadores
 * @returns {boolean} true se sucesso
 */
function saveCriadores(data) {
  const criadores = normalizeMemberList(data, 'criadores');
  return saveJsonFile(DATA_FILES.criadores, { criadores });
}

/**
 * Carrega histórico de votações
 * @returns {Array} Array de votações históricas
 */
function loadVotacoes() {
  const data = loadJsonFile(DATA_FILES.historico, {});
  return Array.isArray(data) ? data : data.votacoes || [];
}

/**
 * Salva histórico de votações
 * @param {Array} data - Array de votações
 * @returns {boolean} true se sucesso
 */
function saveVotacoes(data) {
  return saveJsonFile(DATA_FILES.historico, data);
}

/**
 * Garante que arquivos essenciais existam
 */
function ensureDataFiles() {
  ensureDirectoryExists(DATA_DIR);

  const files = [
    { path: DATA_FILES.mensalistas, content: { mensalistas: [] } },
    { path: DATA_FILES.roleBindings, content: DEFAULT_ROLE_BINDINGS },
    { path: DATA_FILES.historico, content: [] },
    { path: DATA_FILES.criadores, content: { criadores: [] } },
    { path: DATA_FILES.draftPolls, content: [] },
    { path: DATA_FILES.activePolls, content: [] },
  ];

  files.forEach(({ path: filePath, content }) => {
    if (!fs.existsSync(filePath)) {
      saveJsonFile(filePath, content);
      logger.info(`Arquivo criado: ${path.relative(DATA_DIR, filePath)}`);
    }
  });
}

module.exports = {
  loadJsonFile,
  saveJsonFile,
  loadMensalistas,
  saveMensalistas,
  loadRoleBindings,
  saveRoleBindings,
  normalizeRoleBindings,
  loadCriadores,
  ensureDirectoryExists,
  saveCriadores,
  loadVotacoes,
  saveVotacoes,
  ensureDataFiles,
};
