const { client } = require('../../../src/core/client');

function resolveGuildAndChannel({ guildId = null, channelId = null } = {}) {
  const guilds = Array.from(client.guilds?.cache?.values() || []);

  if (guildId) {
    const guild = client.guilds?.cache?.get?.(guildId) || null;
    if (guild) {
      const channel = channelId ? guild.channels?.cache?.get(channelId) : null;
      return {
        serverId: guild.id,
        serverName: guild.name || 'Servidor desconhecido',
        channelId: channel?.id || channelId || null,
        channelName: channel?.name || null,
      };
    }
  }

  if (channelId) {
    for (const guild of guilds) {
      const channel = guild.channels?.cache?.get(channelId);
      if (channel) {
        return {
          serverId: guild.id,
          serverName: guild.name || 'Servidor desconhecido',
          channelId: channel.id,
          channelName: channel.name || null,
        };
      }
    }
  }

  return {
    serverId: guildId || null,
    serverName: 'Servidor desconhecido',
    channelId,
    channelName: channelId ? 'Canal desconhecido' : null,
  };
}

module.exports = {
  resolveGuildAndChannel,
};
