const path = require('path');
const logger = require('./logger');

/**
 * Configuração centralizada para suporte multi-ambiente
 * Suporta prod (padrão) e staging (homologação local)
 */

// Carrega variável de ambiente APP_ENV (prod|staging)
const APP_ENV = process.env.APP_ENV || 'prod';

// Valida ambiente
const VALID_ENVS = ['prod', 'staging'];
if (!VALID_ENVS.includes(APP_ENV)) {
  logger.error(`ERRO: APP_ENV inválido: "${APP_ENV}". Valores aceitos: ${VALID_ENVS.join(', ')}`);
  process.exit(1);
}

// Identificador único da instância (para logs e debugging)
const INSTANCE_ID = process.env.INSTANCE_ID || `${APP_ENV}-${Date.now()}`;

// Modo debug
const DEBUG_MODE = process.env.DEBUG === 'true';

// Token e Client ID são obrigatórios
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
  logger.error('ERRO: TOKEN não está definido no .env');
  process.exit(1);
}

if (!CLIENT_ID) {
  logger.error('ERRO: CLIENT_ID não está definido no .env');
  process.exit(1);
}

// Diretório base para dados (isolado por ambiente)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data/environments', APP_ENV);

// Configuração de deploy de comandos
const DEPLOY = process.env.DEPLOY === 'true' || process.argv.includes('--deploy');

// Porta do servidor HTTP (keep-alive)
const PORT = process.env.PORT || 8000;

// Paths de arquivos de dados (isolados por ambiente)
const DATA_FILES = {
  activePolls: path.join(DATA_DIR, 'active-polls.json'),
  draftPolls: path.join(DATA_DIR, 'draft-polls.json'),
  mensalistas: path.join(DATA_DIR, 'mensalistas.json'),
  roleBindings: path.join(DATA_DIR, 'role-bindings.json'),
  criadores: path.join(DATA_DIR, 'criadores-internos.json'),
  historico: path.join(DATA_DIR, 'historico-votacoes.json'),
};

/**
 * Retorna a configuração atual
 * @returns {Object} Configuração completa
 */
function getConfig() {
  return {
    APP_ENV,
    INSTANCE_ID,
    DEBUG_MODE,
    TOKEN,
    CLIENT_ID,
    DATA_DIR,
    DEPLOY,
    PORT,
    DATA_FILES,
  };
}

/**
 * Exibe resumo da configuração no console
 */
function logConfig() {
  logger.info('----------------------------------------');
  logger.info(`LittleBoatPoll v${logger.version} starting`);
  logger.info(`Ambiente:  ${APP_ENV.toUpperCase()}`);
  logger.info(`Instância: ${INSTANCE_ID}`);
  logger.info(`Debug:     ${DEBUG_MODE ? 'Ativado' : 'Desativado'}`);
  logger.info(`Data Dir:  ${DATA_DIR}`);
  logger.info(`Deploy:    ${DEPLOY ? 'Sim' : 'Não'}`);
  logger.info('----------------------------------------');
}

module.exports = {
  getConfig,
  logConfig,
  APP_ENV,
  INSTANCE_ID,
  DEBUG_MODE,
  TOKEN,
  CLIENT_ID,
  DATA_DIR,
  DEPLOY,
  PORT,
  DATA_FILES,
};
