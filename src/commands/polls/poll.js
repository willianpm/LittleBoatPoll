const { SlashCommandBuilder } = require('discord.js');
const { isCriador } = require('../../utils/permissions');
const {
  validatePollOptions,
  parseOptions,
  hasInvalidOptionsDelimiter,
  getInvalidOptionsDelimiterError,
} = require('../../utils/validators');
const { EMOJIS_DISPONIVEIS, LIMITS } = require('../../utils/constants');
const {
  buildActivePollEmbed,
  embedWithMessageId,
  formatDiscordMaxOptionsError,
  replyPermissionDenied,
  replyValidationError,
  replyToInteraction,
} = require('../../utils/response-builders');
const { handleCommandError } = require('../../utils/error-handler');
const logger = require('../../utils/logger');

/**
 * COMANDO: /enquete
 * Cria uma nova enquete para votação do Clube do Livro
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('enquete')
    .setDescription('Cria uma enquete para votação do Clube do Livro')
    .addStringOption((option) =>
      option.setName('nome-da-enquete').setDescription('Nome/Título da enquete').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('opcoes')
        .setDescription('Opções separadas por | (ex: Livro A | Livro B | Livro C)')
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('max_votos').setDescription('Número máximo de votos por pessoa').setRequired(true).setMinValue(1),
    )
    .addStringOption((option) =>
      option
        .setName('peso_mensalista')
        .setDescription('Mensalistas têm peso 2 nos votos?')
        .setRequired(true)
        .addChoices({ name: 'Sim - Peso 2', value: 'sim' }, { name: 'Não - Peso 1', value: 'nao' }),
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const titulo = interaction.options.getString('nome-da-enquete');
      const opcoesString = interaction.options.getString('opcoes');
      const maxVotos = interaction.options.getInteger('max_votos') || 1;
      const pesoMensalistaOption = interaction.options.getString('peso_mensalista');
      const usarPesoMensalista = pesoMensalistaOption === 'sim';

      if (hasInvalidOptionsDelimiter(opcoesString)) {
        return await replyValidationError(interaction, getInvalidOptionsDelimiterError(), {
          ephemeral: false,
          edit: true,
        });
      }

      const opcoes = parseOptions(opcoesString);

      const validation = validatePollOptions(opcoes, maxVotos);
      if (!validation.valid) {
        return await replyValidationError(interaction, validation.error, { ephemeral: false, edit: true });
      }

      if (!isCriador(interaction.member, interaction.guildId)) {
        return await replyPermissionDenied(interaction, { ephemeral: false, edit: true });
      }

      const emojiNumeros = EMOJIS_DISPONIVEIS.slice(0, opcoes.length);

      if (opcoes.length > LIMITS.MAX_OPTIONS) {
        return await replyToInteraction(interaction, { content: formatDiscordMaxOptionsError() }, { edit: true });
      }

      const pollEmbed = buildActivePollEmbed({
        titulo,
        opcoes,
        emojiNumeros,
        maxVotos,
        usarPesoMensalista,
      });

      await interaction.editReply({ embeds: [pollEmbed] });

      const msg = await interaction.fetchReply();
      const updatedEmbed = embedWithMessageId(pollEmbed, msg.id);
      await interaction.editReply({ embeds: [updatedEmbed] });

      for (let i = 0; i < opcoes.length; i++) {
        await msg.react(emojiNumeros[i]);
      }

      client.activePolls.set(msg.id, {
        messageId: msg.id,
        guildId: interaction.guildId || null,
        channelId: interaction.channelId,
        titulo: titulo,
        opcoes: opcoes,
        emojiNumeros: emojiNumeros.slice(0, opcoes.length),
        maxVotos: maxVotos,
        usarPesoMensalista: usarPesoMensalista,
        criadoEm: new Date(),
        criadoPor: interaction.user?.id || null,
        votos: {},
        status: 'ativa',
      });

      client.saveActivePolls();

      logger.info(
        `Enquete criada: ${titulo} | ${opcoes.length} opções | Max ${maxVotos} votos | ` +
          `Peso mensalista: ${usarPesoMensalista ? 'SIM' : 'NÃO'} | ID: ${msg.id}`,
      );
    } catch (error) {
      await handleCommandError(interaction, error, 'enquete', '❌ Erro ao criar a enquete!');
    }
  },
};
