const { ActivityType } = require('discord.js');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { closePollByMessageId } = require('./poll-close-service');
const { closeExpiredPolls } = require('./poll-autoclose');
const { bindMensalistasRolesOnStartup } = require('./mensalista-runtime');
const { syncPollReactions, enforceVoteLimits } = require('./poll-startup-sync');
const { deployCommands } = require('./command-loader');

const AUTO_CLOSE_INTERVAL_MS = 30 * 1000;
let autoCloseIntervalId = null;
let autoCloseIsRunning = false;

async function runAutoCloseSweep(client) {
  if (autoCloseIsRunning) {
    return;
  }

  autoCloseIsRunning = true;
  try {
    const result = await closeExpiredPolls(client, closePollByMessageId);
    if (result.closed > 0 || result.errors > 0) {
      logger.info(
        `Auto-close: ${result.closed} enquete(s) encerrada(s), ${result.errors} erro(s), ${result.checked} verificada(s)`,
      );
    }
  } catch (error) {
    logger.error(`Erro no auto-close: ${error.message}`);
  } finally {
    autoCloseIsRunning = false;
  }
}

function startAutoCloseScheduler(client) {
  if (autoCloseIntervalId) {
    return;
  }

  autoCloseIntervalId = setInterval(() => {
    runAutoCloseSweep(client);
  }, AUTO_CLOSE_INTERVAL_MS);

  if (typeof autoCloseIntervalId.unref === 'function') {
    autoCloseIntervalId.unref();
  }

  logger.info(`Auto-close scheduler ativo (intervalo ${AUTO_CLOSE_INTERVAL_MS / 1000}s)`);
}

function registerBootstrapHandlers({ client, startKeepAlive, port }) {
  client.once('clientReady', async () => {
    try {
      logger.info(`${client.user.tag} está ONLINE`);
      client.user.setActivity('📚 Clube do Livro', { type: ActivityType.Watching });

      await bindMensalistasRolesOnStartup();

      if (config.DEPLOY) {
        logger.info('Registrando comandos...');
        const deploySuccess = await deployCommands();
        if (deploySuccess) {
          logger.info('Deploy concluído com sucesso');
          if (process.argv.includes('--deploy')) {
            process.exit(0);
          }
        } else {
          logger.error('Deploy falhou');
          if (process.argv.includes('--deploy')) {
            process.exit(1);
          }
        }
      }

      await syncPollReactions();
      await enforceVoteLimits();
      await runAutoCloseSweep(client);
      startAutoCloseScheduler(client);
      startKeepAlive();
      logger.info(`Keep-alive rodando na porta ${port}`);
    } catch (error) {
      logger.error(`Falha durante a inicialização: ${error && (error.stack || error.message)}`);
      process.exit(1);
    }
  });
}

module.exports = {
  registerBootstrapHandlers,
  runAutoCloseSweep,
  startAutoCloseScheduler,
};
