const { loadRoleBindings, saveRoleBindings } = require('./file-handler');

const MENSALISTA_ROLE_NAME = 'mensalistas';

/**
 * Busca o cargo Mensalistas pelo nome (case-insensitive)
 * @param {Guild} guild
 * @returns {Role|null}
 */
function findMensalistasRoleByName(guild) {
  if (!guild?.roles?.cache) return null;

  return guild.roles.cache.find((role) => role.name?.trim().toLowerCase() === MENSALISTA_ROLE_NAME) || null;
}

/**
 * Garante binding persistente entre role interna mensalista e cargo Mensalistas do servidor
 * @param {Guild} guild
 * @returns {Promise<string|null>} ID do cargo vinculado ou null
 */
async function ensureMensalistaRoleBinding(guild) {
  if (!guild?.id) return null;

  const bindings = loadRoleBindings();
  const mensalistaRoleByGuild = bindings.mensalistaRoleByGuild && typeof bindings.mensalistaRoleByGuild === 'object' ? bindings.mensalistaRoleByGuild : {};

  const currentRoleId = mensalistaRoleByGuild[guild.id];
  if (currentRoleId) {
    const persistedRole = guild.roles.cache.get(currentRoleId) || (await guild.roles.fetch(currentRoleId).catch(() => null));
    if (persistedRole) {
      return currentRoleId;
    }
  }

  if (!guild.roles.cache.size) {
    await guild.roles.fetch().catch(() => null);
  }

  const mensalistasRole = findMensalistasRoleByName(guild);

  if (!mensalistasRole) {
    if (currentRoleId) {
      delete mensalistaRoleByGuild[guild.id];
      saveRoleBindings({ mensalistaRoleByGuild });
    }
    return null;
  }

  if (currentRoleId !== mensalistasRole.id) {
    mensalistaRoleByGuild[guild.id] = mensalistasRole.id;
    saveRoleBindings({ mensalistaRoleByGuild });
    console.log(`✓ Cargo \"${mensalistasRole.name}\" vinculado ao papel interno mensalista no servidor ${guild.name}`);
  }

  return mensalistasRole.id;
}

module.exports = {
  MENSALISTA_ROLE_NAME,
  findMensalistasRoleByName,
  ensureMensalistaRoleBinding,
};
