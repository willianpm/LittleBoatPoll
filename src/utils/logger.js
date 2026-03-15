const packageJson = require('../../package.json');

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

  if (level === 'WARN') {
    console.warn(line);
  } else if (level === 'ERROR') {
    console.error(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  version: packageJson.version,
  info: (msg) => log('INFO', msg),
  warn: (msg) => log('WARN', msg),
  error: (msg, err) => {
    log('ERROR', msg);
    if (err?.stack) log('ERROR', err.stack);
  },
  separator: () => console.log(`${timestamp()} [INFO] ----------------------------------------`),
};
