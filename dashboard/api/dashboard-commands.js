// Endpoint para execução de comandos via dashboard
// Não altera lógica dos comandos nem duplicação

const express = require('express');
const router = express.Router();
const { client } = require('../../src/core/client'); // Garante acesso ao client e comandos
const { validateDashboardToken } = require('./auth');

function buildFakeInteraction({ commandName, options, user, guild, member, permissions }) {
  return {
    commandName,
    options,
    user,
    guild,
    member,
    memberPermissions: permissions,
    isChatInputCommand: () => true,
    deferred: false,
    reply: async function (payload) {
      this._replyPayload = payload;
      return payload;
    },
    editReply: async function (payload) {
      this._replyPayload = payload;
      return payload;
    },
  };
}

const commandLocks = new Map();
async function withCommandLock(commandName, fn) {
  if (commandLocks.get(commandName)) {
    throw new Error('Comando já está em execução. Tente novamente em instantes.');
  }
  commandLocks.set(commandName, true);
  try {
    return await fn();
  } finally {
    commandLocks.delete(commandName);
  }
}

router.post('/:commandName', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    if (!validateDashboardToken(token)) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { commandName } = req.params;
    const { options, user, guild, member, permissions } = req.body;

    const command = client.commands.get(commandName);
    if (!command) {
      return res.status(404).json({ error: 'Comando não encontrado' });
    }

    const guildObj = client.guilds.cache.get(guild?.id);
    if (!guildObj) {
      return res.status(403).json({ error: 'Bot não está presente na guild informada' });
    }

    const interaction = buildFakeInteraction({
      commandName,
      options,
      user,
      guild: guildObj,
      member,
      permissions,
    });

    const result = await withCommandLock(commandName, async () => {
      await command.execute(interaction, client);
      return interaction._replyPayload || { success: true };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
