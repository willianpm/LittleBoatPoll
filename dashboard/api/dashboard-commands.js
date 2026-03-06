// Endpoint para execução de comandos via dashboard
// Não altera lógica dos comandos nem duplicação

const express = require('express');
const router = express.Router();
const { client } = require('../../src/core/client'); // Garante acesso ao client e comandos
const { validateDashboardToken } = require('./auth');

function buildFakeInteraction({ commandName, options, user, guild, member, permissions }) {
  // Cria um "options resolver" simples, compatível com os métodos mais usados
  function createOptionsResolver(rawOptions) {
    // Normaliza para array de { name, type, value, options }
    let optionArray;
    if (Array.isArray(rawOptions)) {
      optionArray = rawOptions;
    } else if (rawOptions && typeof rawOptions === 'object') {
      optionArray = Object.entries(rawOptions).map(([name, value]) => ({ name, value }));
    } else {
      optionArray = [];
    }

    function findOption(name) {
      return optionArray.find((opt) => opt.name === name) || null;
    }

    return {
      // Métodos básicos de leitura de opções
      getString(name) {
        const opt = findOption(name);
        if (!opt || opt.value == null) return null;
        return String(opt.value);
      },
      getInteger(name) {
        const opt = findOption(name);
        if (!opt || opt.value == null) return null;
        const num = typeof opt.value === 'number' ? opt.value : parseInt(opt.value, 10);
        return Number.isNaN(num) ? null : num;
      },
      getNumber(name) {
        const opt = findOption(name);
        if (!opt || opt.value == null) return null;
        const num = typeof opt.value === 'number' ? opt.value : parseFloat(opt.value);
        return Number.isNaN(num) ? null : num;
      },
      getBoolean(name) {
        const opt = findOption(name);
        if (!opt || opt.value == null) return null;
        if (typeof opt.value === 'boolean') return opt.value;
        if (typeof opt.value === 'string') {
          if (opt.value.toLowerCase() === 'true') return true;
          if (opt.value.toLowerCase() === 'false') return false;
        }
        return Boolean(opt.value);
      },
      // Subcomando simples: se houver uma opção com "type" de subcommand, retorna o nome
      getSubcommand() {
        const sub = optionArray.find((opt) => opt.type === 'SUB_COMMAND' || opt.type === 1);
        return sub ? sub.name : null;
      },
    };
  }

  const interaction = {
    commandName,
    options: createOptionsResolver(options),
    user,
    guild,
    member,
    memberPermissions: permissions,
    isChatInputCommand: () => true,
    deferred: false,
    replied: false,
    _replyPayload: null,
    _ephemeral: false,
    async deferReply(opts) {
      this.deferred = true;
      this.replied = false;
      if (opts && typeof opts.ephemeral === 'boolean') {
        this._ephemeral = opts.ephemeral;
      }
      return;
    },
    reply: async function (payload) {
      this._replyPayload = payload;
      this.replied = true;
      this.deferred = false;
      return payload;
    },
    editReply: async function (payload) {
      this._replyPayload = payload;
      // manter replied/deferred como já estão; em geral, editReply é chamado após deferReply
      this.replied = true;
      return payload;
    },
  };

  return interaction;
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
