const { client } = require('./client');
const logger = require('../utils/logger');
const { loadMensalistas } = require('../utils/file-handler');
const { ensureMensalistaRoleBinding } = require('../utils/mensalista-binding');

function getMensalistasSet() {
  const mensalistasData = loadMensalistas();
  return new Set(mensalistasData.mensalistas || []);
}

async function isUserMensalista(guild, userId, mensalistasSet = null) {
  const isMensalistaManual = (mensalistasSet || getMensalistasSet()).has(userId);

  if (!guild) {
    return isMensalistaManual;
  }

  const roleId = await ensureMensalistaRoleBinding(guild);
  if (!roleId) {
    return isMensalistaManual;
  }

  const member =
    guild.members.cache.get(userId) || (await guild.members.fetch({ user: userId, force: true }).catch(() => null));
  const isMensalistaByRole = Boolean(member?.roles?.cache?.has(roleId));

  return isMensalistaManual || isMensalistaByRole;
}

async function bindMensalistasRolesOnStartup() {
  let vinculados = 0;

  for (const guild of client.guilds.cache.values()) {
    await guild.roles.fetch().catch(() => null);
    const roleId = await ensureMensalistaRoleBinding(guild);
    if (roleId) vinculados++;
  }

  if (vinculados > 0) {
    logger.info(`Binding automático de mensalista ativo em ${vinculados} servidor(es)`);
  } else {
    logger.info('Cargo "Mensalistas" não encontrado. Mantendo comportamento padrão de mensalistas internos.');
  }
}

module.exports = {
  getMensalistasSet,
  isUserMensalista,
  bindMensalistasRolesOnStartup,
};
