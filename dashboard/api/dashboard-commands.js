// Endpoint para execução de comandos via dashboard
// Não altera lógica dos comandos nem duplicação

const express = require('express');
const fs = require('fs');
const router = express.Router();
const { client } = require('../../src/core/client'); // Garante acesso ao client e comandos
const { validateDashboardToken } = require('./auth');
const { resolveGuildAndChannel } = require('./utils/guild-channel-resolver');
const { isValidDurationKey } = require('../../src/utils/poll-duration');

const EPHEMERAL_FLAG = 64;
const COMMAND_LOCKED_ERROR_CODE = 'COMMAND_LOCKED';

function successResponse(res, message, statusCode = 200, extra = {}) {
  return res.status(statusCode).json({ success: true, message, ...extra });
}

function errorResponse(res, statusCode, error, extra = {}) {
  return res.status(statusCode).json({ success: false, error, ...extra });
}

function logDashboardCommand(level, event, metadata = {}) {
  const payload = {
    source: 'dashboard-commands',
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.log(payload);
}

function normalizeOptionsPayload(rawOptions) {
  if (!rawOptions) return [];

  if (Array.isArray(rawOptions)) {
    return rawOptions;
  }

  if (rawOptions && typeof rawOptions === 'object') {
    if (typeof rawOptions.subcommand === 'string') {
      const subOptions = Object.entries(rawOptions.values || {}).map(([name, value]) => ({ name, value }));
      return [{ type: 'SUB_COMMAND', name: rawOptions.subcommand, options: subOptions }];
    }

    return Object.entries(rawOptions).map(([name, value]) => ({ name, value }));
  }

  return [];
}

function getRequestedSubcommand(rawOptions) {
  const normalized = normalizeOptionsPayload(rawOptions);
  const subcommandOption = normalized.find((opt) => opt.type === 'SUB_COMMAND' || opt.type === 1);
  if (!subcommandOption || typeof subcommandOption.name !== 'string') {
    return null;
  }

  return subcommandOption.name;
}

function normalizeDraftOption(option) {
  if (typeof option === 'string') {
    const text = option.trim();
    if (!text) return null;
    return { text, emoji: null };
  }

  if (!option || typeof option !== 'object') {
    return null;
  }

  const text = typeof option.text === 'string' ? option.text.trim() : '';
  const emoji = typeof option.emoji === 'string' ? option.emoji.trim() : null;

  if (!text) return null;
  return { text, emoji: emoji || null };
}

function normalizeDraftOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((option) => normalizeDraftOption(option)).filter(Boolean);
}

async function hydrateDraftsFromDiskIfNeeded() {
  if (client.draftPolls.size > 0) {
    return;
  }

  try {
    const { DATA_FILES } = require('../../src/utils/config');
    const draftPath = DATA_FILES.draftPolls;

    if (!draftPath || !fs.existsSync(draftPath)) {
      return;
    }

    const raw = await fs.promises.readFile(draftPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return;
    }

    client.draftPolls = new Map(parsed.filter((draft) => draft && draft.id).map((draft) => [draft.id, draft]));

    logDashboardCommand('info', 'drafts_hydrated_from_disk', {
      count: client.draftPolls.size,
      path: draftPath,
    });
  } catch (err) {
    logDashboardCommand('error', 'drafts_hydration_failed', { error: err.message });
  }
}

function resolveMockUser(userId) {
  if (!userId) return null;
  const user = client.users?.cache?.get(userId);
  return (
    user || {
      id: userId,
      username: `user-${userId}`,
      tag: `user-${userId}`,
    }
  );
}

function resolveMockChannel(guildObj, channelId) {
  if (!guildObj || !channelId) return null;
  const channel = guildObj.channels?.cache?.get(channelId);
  return (
    channel || {
      id: channelId,
      guild: guildObj,
      name: `channel-${channelId}`,
    }
  );
}

function sanitizeFriendlyText(text) {
  if (!text) return '';

  const raw = String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\*\*|__|~~|`/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return raw;
}

function isBotConnected() {
  if (typeof client.isReady === 'function') {
    return client.isReady();
  }

  return true;
}

function getFirstEmbed(payload) {
  const embeds = payload?.embeds;
  if (!Array.isArray(embeds) || embeds.length === 0) return null;

  const first = embeds[0];
  if (!first) return null;
  if (typeof first.toJSON === 'function') {
    return first.toJSON();
  }

  if (first.data && typeof first.data === 'object') {
    return first.data;
  }

  return first;
}

function extractFriendlyMessage(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const content = sanitizeFriendlyText(payload.content);
  if (content) return content;

  const embed = getFirstEmbed(payload);
  if (!embed) return '';

  const title = sanitizeFriendlyText(embed.title);
  if (title) return title;

  const description = sanitizeFriendlyText(embed.description);
  if (description) return description;

  return '';
}

function isCommandErrorPayload(payload) {
  const message = extractFriendlyMessage(payload).toLowerCase();
  if (!message) return false;

  return (
    message.startsWith('erro') ||
    message.includes(' erro') ||
    message.includes('não tem permissão') ||
    message.includes('nao tem permissao') ||
    message.includes('acesso negado')
  );
}

function isEphemeral(payload, interactionEphemeral) {
  if (!payload || typeof payload !== 'object') {
    return Boolean(interactionEphemeral);
  }

  if (payload.ephemeral === true) return true;
  if (typeof payload.flags === 'number') {
    return (payload.flags & EPHEMERAL_FLAG) === EPHEMERAL_FLAG;
  }

  return Boolean(interactionEphemeral);
}

function toDiscordMessagePayload(payload) {
  if (typeof payload === 'string') {
    return { content: payload };
  }

  if (!payload || typeof payload !== 'object') {
    return { content: '' };
  }

  const safePayload = { ...payload };
  delete safePayload.flags;
  delete safePayload.ephemeral;
  return safePayload;
}

function resolveExecutionChannel(guildObj, target, options = {}) {
  const { allowFallback = true } = options;
  const fromTarget = target?.channelId ? guildObj.channels?.cache?.get(target.channelId) : null;
  if (fromTarget && typeof fromTarget.send === 'function' && fromTarget.isTextBased?.()) {
    return fromTarget;
  }

  if (target?.channelId || !allowFallback) {
    return null;
  }

  if (
    guildObj.systemChannel &&
    typeof guildObj.systemChannel.send === 'function' &&
    guildObj.systemChannel.isTextBased?.()
  ) {
    return guildObj.systemChannel;
  }

  const fallbackChannel = Array.from(guildObj.channels?.cache?.values() || []).find(
    (channel) => channel?.isTextBased?.() && typeof channel.send === 'function',
  );

  return fallbackChannel || null;
}

function buildFakeInteraction({
  commandName,
  commandType,
  options,
  user,
  guild,
  member,
  target,
  executionChannel,
  dashboardSource,
}) {
  // Cria um "options resolver" simples, compatível com os métodos mais usados
  function createOptionsResolver(rawOptions) {
    const optionArray = normalizeOptionsPayload(rawOptions);
    const subcommandOption = optionArray.find((opt) => opt.type === 'SUB_COMMAND' || opt.type === 1) || null;
    const activeOptions = subcommandOption?.options || optionArray;

    function findOption(name) {
      return activeOptions.find((opt) => opt.name === name) || null;
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
        return subcommandOption ? subcommandOption.name : null;
      },
      getUser(name) {
        const opt = findOption(name);
        if (!opt || opt.value == null) return null;
        return resolveMockUser(String(opt.value));
      },
      getChannel(name) {
        const opt = findOption(name);
        if (!opt || opt.value == null) return null;
        return resolveMockChannel(guild, String(opt.value));
      },
    };
  }

  let targetMessage = null;
  if (target?.messageId) {
    targetMessage = {
      id: String(target.messageId),
      content: String(target.messageContent || ''),
    };
  }

  const targetUser = target?.userId ? resolveMockUser(String(target.userId)) : null;
  const targetMember = targetUser ? guild?.members?.cache?.get(targetUser.id) || null : null;

  const interaction = {
    commandName,
    commandType,
    guild,
    guildId: guild?.id,
    channel: executionChannel,
    channelId: executionChannel?.id || target?.channelId || null,
    dashboardSource: dashboardSource || null,
    options: createOptionsResolver(options),
    user,
    member,
    memberPermissions: member?.permissions || null,
    targetMessage,
    targetUser,
    targetMember,
    isChatInputCommand: () => commandType === 1,
    isUserContextMenuCommand: () => commandType === 2,
    isMessageContextMenuCommand: () => commandType === 3,
    deferred: false,
    replied: false,
    _replyPayload: null,
    _sentMessage: null,
    _ephemeral: false,
    async deferReply(opts) {
      this.deferred = true;
      this.replied = false;
      if (opts && typeof opts.ephemeral === 'boolean') {
        this._ephemeral = opts.ephemeral;
      } else if (opts && typeof opts.flags === 'number') {
        this._ephemeral = (opts.flags & EPHEMERAL_FLAG) === EPHEMERAL_FLAG;
      }
      return;
    },
    reply: async function (payload) {
      this._replyPayload = payload;
      if (!isEphemeral(payload, this._ephemeral) && this.channel && typeof this.channel.send === 'function') {
        try {
          this._sentMessage = await this.channel.send(toDiscordMessagePayload(payload));
        } catch (sendError) {
          logDashboardCommand('error', 'reply_send_failed', {
            commandName,
            guildId: this.guildId,
            channelId: this.channelId,
            error: sendError.message,
            stack: sendError.stack,
          });
        }
      }
      this.replied = true;
      this.deferred = false;
      return payload;
    },
    editReply: async function (payload) {
      this._replyPayload = payload;
      if (!isEphemeral(payload, this._ephemeral) && this.channel && typeof this.channel.send === 'function') {
        try {
          if (this._sentMessage && typeof this._sentMessage.edit === 'function') {
            this._sentMessage = await this._sentMessage.edit(toDiscordMessagePayload(payload));
          } else {
            this._sentMessage = await this.channel.send(toDiscordMessagePayload(payload));
          }
        } catch (sendError) {
          logDashboardCommand('error', 'edit_reply_send_failed', {
            commandName,
            guildId: this.guildId,
            channelId: this.channelId,
            error: sendError.message,
            stack: sendError.stack,
          });
        }
      }
      // manter replied/deferred como já estão; em geral, editReply é chamado após deferReply
      this.replied = true;
      return payload;
    },
    fetchReply: async function () {
      if (this._sentMessage) {
        return this._sentMessage;
      }

      // Retorna um objeto de mensagem simulado para contextosque precisam do messageId
      // (como ao adicionar reações em comandos de enquete)
      const mockMessageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: mockMessageId,
        content: this._replyPayload?.content || '',
        embeds: this._replyPayload?.embeds || [],
        react: async function () {
          // Mock para react() - não faz nada no contexto do dashboard
          return undefined;
        },
      };
    },
  };

  return interaction;
}

const commandLocks = new Map();
async function withCommandLock(commandName, fn) {
  if (commandLocks.get(commandName)) {
    const lockError = new Error('Comando já está em execução. Tente novamente em instantes.');
    lockError.code = COMMAND_LOCKED_ERROR_CODE;
    throw lockError;
  }
  commandLocks.set(commandName, true);
  try {
    return await fn();
  } finally {
    commandLocks.delete(commandName);
  }
}

function mapCommandType(commandType) {
  if (commandType === 2) return 'context-user';
  if (commandType === 3) return 'context-message';
  return 'chat-input';
}

function toCatalogItem(command) {
  const data = command?.data?.toJSON ? command.data.toJSON() : null;
  if (!data) return null;

  return {
    name: data.name,
    description: data.description || '',
    type: data.type || 1,
    typeLabel: mapCommandType(data.type || 1),
    options: data.options || [],
    hasSubcommands: Boolean((data.options || []).some((opt) => opt.type === 1)),
  };
}

router.get('/catalog', validateDashboardToken, async (_req, res) => {
  try {
    const commands = Array.from(client.commands.values())
      .map((entry) => toCatalogItem(entry))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return successResponse(res, 'Catálogo carregado com sucesso', 200, { commands });
  } catch (err) {
    logDashboardCommand('error', 'catalog_failed', { error: err.message, stack: err.stack });
    return errorResponse(res, 500, 'Erro ao carregar catálogo de comandos');
  }
});

router.get('/context-targets/polls', validateDashboardToken, async (req, res) => {
  try {
    const guildId = req.query.guildId || req.dashboardAuth.guildId;
    if (!req.dashboardAuth.accessibleGuildIds.includes(guildId)) {
      return errorResponse(res, 403, 'Acesso negado para o servidor informado');
    }

    const polls = Array.from(client.activePolls.values())
      .map((poll) => ({
        messageId: poll.messageId,
        channelId: poll.channelId,
        title: poll.titulo,
        options: poll.opcoes || [],
        status: poll.status,
        creatorId: poll.criadoPor || poll.criadorId || null,
      }))
      .filter((poll) => poll.status === 'ativa');

    return successResponse(res, 'Enquetes de contexto carregadas com sucesso', 200, { polls });
  } catch (err) {
    logDashboardCommand('error', 'context_polls_failed', { error: err.message, stack: err.stack });
    return errorResponse(res, 500, 'Erro ao carregar enquetes de contexto');
  }
});

router.get('/context-targets/drafts', validateDashboardToken, async (req, res) => {
  try {
    await hydrateDraftsFromDiskIfNeeded();
    const accessibleGuildIds = new Set(req.dashboardAuth.accessibleGuildIds || []);

    const drafts = Array.from(client.draftPolls.values())
      .filter((draft) => draft.origem === 'dashboard-create')
      .map((draft) => {
        const normalizedOptions = normalizeDraftOptions(draft.opcoes);
        const resolvedTarget = resolveGuildAndChannel({
          guildId: draft.guildId || null,
          channelId: draft.channelId || null,
        });
        const resolvedGuildId = draft.guildId || resolvedTarget.serverId || null;
        const parsedMaxVotes = Number(draft.maxVotos);
        const safeMaxVotes = Number.isFinite(parsedMaxVotes)
          ? Math.min(10, Math.max(1, Math.trunc(parsedMaxVotes)))
          : 1;

        return {
          id: draft.id,
          title: draft.titulo,
          guildId: resolvedGuildId,
          channelId: draft.channelId || resolvedTarget.channelId || null,
          serverName: resolvedTarget.serverName || null,
          channelName: resolvedTarget.channelName || null,
          optionsCount: normalizedOptions.length,
          creatorId: draft.criadorId,
          creatorName: draft.criadorNome || null,
          options: normalizedOptions,
          maxVotes: safeMaxVotes,
          pesoMensalista: draft.usarPesoMensalista ? 'sim' : 'nao',
          durationKey: isValidDurationKey(draft.durationKey) ? draft.durationKey : '24h',
          updatedAt: draft.editadoEm || draft.criadoEm || null,
        };
      })
      .filter((draft) => draft.guildId && accessibleGuildIds.has(draft.guildId))
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

    return successResponse(res, 'Rascunhos carregados com sucesso', 200, { drafts });
  } catch (err) {
    logDashboardCommand('error', 'context_drafts_failed', { error: err.message, stack: err.stack });
    return errorResponse(res, 500, 'Erro ao carregar rascunhos de contexto');
  }
});

router.post('/:commandName', validateDashboardToken, async (req, res) => {
  let requestedSubcommand = null;

  try {
    const { commandName } = req.params;
    const { options, guild, commandType, target, dashboardSource } = req.body;
    requestedSubcommand = getRequestedSubcommand(options);
    const isStrictDashboardFlow =
      commandName === 'rascunho' && (requestedSubcommand === 'criar' || requestedSubcommand === 'publicar');

    if (commandName === 'rascunho') {
      await hydrateDraftsFromDiskIfNeeded();
    }

    if (!isBotConnected()) {
      return errorResponse(res, 503, 'Bot está offline no momento. Tente novamente em instantes.');
    }

    const command = client.commands.get(commandName);
    if (!command) {
      return errorResponse(res, 404, 'Comando inválido ou não encontrado');
    }

    const rawType = command?.data?.toJSON?.()?.type || 1;
    const effectiveType = Number(commandType) || rawType;

    if (effectiveType !== rawType) {
      return errorResponse(res, 400, 'Tipo do comando inválido para o comando selecionado');
    }

    if (isStrictDashboardFlow && !guild?.id) {
      return errorResponse(res, 400, 'guild.id é obrigatório para criar/publicar rascunhos via dashboard');
    }

    const effectiveGuildId = guild?.id || req.dashboardAuth.guildId;
    if (!req.dashboardAuth.accessibleGuildIds.includes(effectiveGuildId)) {
      logDashboardCommand('warn', 'guild_access_denied', {
        commandName,
        userId: req.dashboardAuth.userId,
        requestedGuildId: guild?.id || null,
        fallbackGuildId: req.dashboardAuth.guildId,
        effectiveGuildId,
      });
      return errorResponse(res, 403, 'Acesso negado para o servidor informado');
    }

    const guildObj = client.guilds.cache.get(effectiveGuildId);
    if (!guildObj) {
      return errorResponse(res, 404, 'Bot não está conectado ao servidor selecionado');
    }

    const guildMember =
      guildObj.members?.cache?.get(req.dashboardAuth.userId) ||
      (await guildObj.members?.fetch?.(req.dashboardAuth.userId).catch(() => null)) ||
      req.dashboardAuth.member;

    if (effectiveType === 1 && commandName !== 'rascunho' && !target?.channelId) {
      return errorResponse(res, 400, 'channelId é obrigatório para comandos de chat (tipo 1)');
    }

    if (isStrictDashboardFlow && !target?.channelId) {
      return errorResponse(res, 400, 'channelId é obrigatório para criar/publicar rascunhos via dashboard');
    }

    const executionChannel = resolveExecutionChannel(guildObj, target || {}, {
      allowFallback: !isStrictDashboardFlow,
    });
    if (!executionChannel && (effectiveType === 1 || effectiveType === 3)) {
      logDashboardCommand('warn', 'channel_resolution_failed', {
        commandName,
        subcommand: requestedSubcommand,
        userId: req.dashboardAuth.userId,
        requestedGuildId: guild?.id || null,
        effectiveGuildId,
        requestedChannelId: target?.channelId || null,
        isStrictDashboardFlow,
      });

      if (target?.channelId) {
        return errorResponse(res, 404, 'Canal selecionado não encontrado ou indisponível no servidor informado');
      }

      return errorResponse(res, 404, 'Servidor não encontrado ou sem canal de texto disponível para execução');
    }

    const interaction = buildFakeInteraction({
      commandName,
      commandType: effectiveType,
      options,
      user: {
        id: req.dashboardAuth.userId,
        username: req.dashboardAuth.username,
      },
      guild: guildObj,
      member: guildMember,
      target: target || {},
      executionChannel,
      dashboardSource,
    });

    logDashboardCommand('info', 'execute_start', {
      commandName,
      subcommand: requestedSubcommand,
      guildId: effectiveGuildId,
      userId: req.dashboardAuth.userId,
      commandType: effectiveType,
      requestedChannelId: target?.channelId || null,
      channelId: interaction.channelId,
      strictChannelResolution: isStrictDashboardFlow,
    });

    const payload = await withCommandLock(commandName, async () => {
      await command.execute(interaction, client);
      return interaction._replyPayload || { success: true };
    });

    const friendlyMessage = extractFriendlyMessage(payload) || 'Comando executado com sucesso';

    if (isCommandErrorPayload(payload)) {
      logDashboardCommand('info', 'execute_business_error', {
        commandName,
        guildId: effectiveGuildId,
        userId: req.dashboardAuth.userId,
        message: friendlyMessage,
      });

      return errorResponse(res, 400, friendlyMessage);
    }

    logDashboardCommand('info', 'execute_success', {
      commandName,
      subcommand: requestedSubcommand,
      guildId: effectiveGuildId,
      userId: req.dashboardAuth.userId,
      message: friendlyMessage,
      requestedChannelId: target?.channelId || null,
      resolvedChannelId: interaction.channelId,
    });

    return successResponse(res, friendlyMessage);
  } catch (err) {
    if (err?.code === COMMAND_LOCKED_ERROR_CODE) {
      return errorResponse(res, 429, 'Comando já está em execução. Tente novamente em instantes.');
    }

    logDashboardCommand('error', 'execute_failed', {
      commandName: req.params.commandName,
      subcommand: requestedSubcommand,
      guildId: req.body?.guild?.id || req.dashboardAuth?.guildId,
      userId: req.dashboardAuth?.userId,
      requestedChannelId: req.body?.target?.channelId || null,
      error: err.message,
      stack: err.stack,
    });

    return errorResponse(res, 500, 'Erro interno ao executar comando');
  }
});

module.exports = router;
