const fs = require('fs');
const path = require('path');
const { DATA_FILES, DATA_DIR } = require('./config');

const DEFAULT_ROLE_BINDINGS = {
  mensalistaRoleByGuild: {},
  adminRoleIdsByGuild: {},
};

function normalizeSnowflakeId(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/\d{5,}/);
    return match ? match[0] : trimmed;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  return null;
}

/**
 * Normaliza estrutura de role-bindings para formato esperado
 * @param {Object} data - Dados brutos carregados do JSON
 * @returns {Object} Estrutura normalizada
 */
function normalizeRoleBindings(data = {}) {
  const mensalistaRoleByGuild = data?.mensalistaRoleByGuild && typeof data.mensalistaRoleByGuild === 'object' ? data.mensalistaRoleByGuild : {};

  const rawAdminRoleIds = data?.adminRoleIdsByGuild && typeof data.adminRoleIdsByGuild === 'object' ? data.adminRoleIdsByGuild : {};

  const adminRoleIdsByGuild = Object.fromEntries(
    Object.entries(rawAdminRoleIds).map(([guildId, roleIds]) => {
      if (Array.isArray(roleIds)) {
        return [guildId, [...new Set(roleIds.map((roleId) => normalizeSnowflakeId(roleId)).filter(Boolean))]];
      }

      const normalizedSingleRoleId = normalizeSnowflakeId(roleIds);
      if (normalizedSingleRoleId) {
        return [guildId, [normalizedSingleRoleId]];
      }

      return [guildId, []];
    }),
  );

  return {
    mensalistaRoleByGuild,
    adminRoleIdsByGuild,
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
    // Garante que o diretório existe
    ensureDirectoryExists(path.dirname(filePath));

    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`Erro ao carregar ${filePath}:`, error);
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
    // Garante que o diretório existe
    ensureDirectoryExists(path.dirname(filePath));

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${filePath}:`, error);
    return false;
  }
}

/**
 * Carrega a lista de mensalistas
 * @returns {Object} Objeto com array de IDs
 */
function loadMensalistas() {
  return loadJsonFile(DATA_FILES.mensalistas, { mensalistas: [] });
}

/**
 * Salva a lista de mensalistas
 * @param {Object} data - Dados com array de mensalistas
 * @returns {boolean} true se sucesso
 */
function saveMensalistas(data) {
  return saveJsonFile(DATA_FILES.mensalistas, data);
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
  return loadJsonFile(DATA_FILES.criadores, { criadores: [] });
}

/**
 * Salva lista de criadores internos
 * @param {Object} data - Dados com array de criadores
 * @returns {boolean} true se sucesso
 */
function saveCriadores(data) {
  return saveJsonFile(DATA_FILES.criadores, data);
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
  // Garante que o diretório de dados existe
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
      console.log(`✓ Arquivo criado: ${path.relative(DATA_DIR, filePath)}`);
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
