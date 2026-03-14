const packageJson = require('../../package.json');

const LEVELS = { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };

function timestamp() {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function log(level, message) {
  const line = `${timestamp()} [${level}] ${message}`;
  console.log(line);
}

module.exports = {
  version: packageJson.version,
  info: (msg) => log(LEVELS.INFO, msg),
  warn: (msg) => log(LEVELS.WARN, msg),
  error: (msg) => log(LEVELS.ERROR, msg),
};
