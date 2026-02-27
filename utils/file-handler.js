const fs = require('fs');

/**
 * Carrega um arquivo JSON com valor padrão em caso de erro
 * @param {string} filePath - Caminho do arquivo
 * @param {any} defaultValue - Valor padrão se arquivo não existir
 * @returns {any} Dados do JSON ou valor padrão
 */
function loadJsonFile(filePath, defaultValue = {}) {
  try {
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
  return loadJsonFile('./mensalistas.json', { mensalistas: [] });
}

/**
 * Salva a lista de mensalistas
 * @param {Object} data - Dados com array de mensalistas
 * @returns {boolean} true se sucesso
 */
function saveMensalistas(data) {
  return saveJsonFile('./mensalistas.json', data);
}

/**
 * Carrega mapeamento de cargos internos por servidor
 * @returns {Object} Objeto com bindings por guild
 */
function loadRoleBindings() {
  return loadJsonFile('./role-bindings.json', { mensalistaRoleByGuild: {} });
}

/**
 * Salva mapeamento de cargos internos por servidor
 * @param {Object} data - Dados de bindings
 * @returns {boolean} true se sucesso
 */
function saveRoleBindings(data) {
  return saveJsonFile('./role-bindings.json', data);
}

/**
 * Carrega lista de criadores internos (IDs de usuários)
 * @returns {Object} Objeto com array de IDs de usuários
 */
function loadCriadores() {
  return loadJsonFile('./criadores-internos.json', { criadores: [] });
}

/**
 * Salva lista de criadores internos
 * @param {Object} data - Dados com array de criadores
 * @returns {boolean} true se sucesso
 */
function saveCriadores(data) {
  return saveJsonFile('./criadores-internos.json', data);
}

/**
 * Carrega histórico de votações
 * @returns {Array} Array de votações históricas
 */
function loadVotacoes() {
  const data = loadJsonFile('./historico-votacoes.json', {});
  return Array.isArray(data) ? data : data.votacoes || [];
}

/**
 * Salva histórico de votações
 * @param {Array} data - Array de votações
 * @returns {boolean} true se sucesso
 */
function saveVotacoes(data) {
  return saveJsonFile('./historico-votacoes.json', data);
}

/**
 * Garante que arquivos essenciais existam
 */
function ensureDataFiles() {
  const files = [
    { path: './mensalistas.json', content: { mensalistas: [] } },
    { path: './role-bindings.json', content: { mensalistaRoleByGuild: {} } },
    { path: './historico-votacoes.json', content: [] },
    { path: './criadores-internos.json', content: { criadores: [] } },
    { path: './draft-polls.json', content: [] },
  ];

  files.forEach(({ path, content }) => {
    if (!fs.existsSync(path)) {
      saveJsonFile(path, content);
      console.log(`Arquivo ${path} criado`);
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
  loadCriadores,
  saveCriadores,
  loadVotacoes,
  saveVotacoes,
  ensureDataFiles,
};
