const { EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LIMITS } = require('./constants');

function formatValidationError(message) {
  return `❌ **Erro!** ${message}`;
}

function formatDraftNotFound(draftId) {
  return formatValidationError(`Rascunho com ID \`${draftId}\` não encontrado.`);
}

function formatDiscordMaxOptionsError() {
  return (
    '❌ **Erro!** O Discord limita a 20 reações por mensagem. ' + `Máximo: ${LIMITS.MAX_OPTIONS} opções por enquete.`
  );
}

function buildPollOptionsDescription(opcoes, emojiNumeros, maxVotos) {
  let descricao = `Selecione até ${maxVotos} opç${maxVotos > 1 ? 'ões' : 'ão'}:\n\n`;
  opcoes.forEach((opcao, index) => {
    descricao += `**${emojiNumeros[index]} ${opcao}**\n\n`;
  });
  return descricao;
}

function buildActivePollEmbed({ titulo, opcoes, emojiNumeros, maxVotos, usarPesoMensalista }) {
  const pesoInfo = usarPesoMensalista ? 'Mensalistas têm peso 2 nos votos' : 'Todos têm o mesmo peso';
  const descricao = buildPollOptionsDescription(opcoes, emojiNumeros, maxVotos);

  return new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setTitle(`${titulo} `)
    .setDescription(descricao)
    .addFields(
      { name: '\u200B', value: '\u200B', inline: false },
      {
        name: 'Regras 📊',
        value: `• Você pode votar em até ${maxVotos} opç${maxVotos > 1 ? 'ões' : 'ão'}\n\n• ${pesoInfo}`,
        inline: false,
      },
    )
    .setFooter({ text: `${opcoes.length} opções disponíveis` })
    .setTimestamp();
}

function embedWithMessageId(pollEmbed, messageId) {
  return EmbedBuilder.from(pollEmbed).addFields({ name: 'ID', value: `${messageId}`, inline: false });
}

function buildEmbed({ color, title, description, fields = [], footer, timestamp = true }) {
  const embed = new EmbedBuilder().setColor(color);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length > 0) embed.addFields(fields);
  if (footer) {
    embed.setFooter(typeof footer === 'string' ? { text: footer } : footer);
  }
  if (timestamp) embed.setTimestamp();
  return embed;
}

function buildDraftCreatedEmbed({ draftId, titulo, opcoesInline, maxVotos, usarPesoMensalista, durationLabel }) {
  return buildEmbed({
    color: COLORS.NEUTRAL,
    title: '✅ Rascunho Criado com Sucesso!',
    fields: [
      { name: 'ID do Rascunho', value: `\`${draftId}\`` },
      { name: 'Título', value: titulo },
      { name: 'Opções', value: opcoesInline },
      { name: 'Máximo de Votos', value: `${maxVotos}`, inline: true },
      { name: 'Peso Mensalista', value: usarPesoMensalista ? 'Sim (2x)' : 'Não (1x)', inline: true },
      { name: 'Duração', value: durationLabel, inline: true },
      {
        name: 'Próximos Passos',
        value: `
- Use \`/rascunho editar\` para fazer alterações
- Use \`/rascunho exibir\` para visualizar os detalhes
- Use \`/rascunho publicar\` para ativar a enquete para votação
        `,
      },
    ],
    footer: 'Status: 📝 Rascunho (não publicado)',
  });
}

function buildDraftPublishedEmbed({ titulo, targetChannel, guildId, messageId }) {
  return buildEmbed({
    color: COLORS.SUCCESS,
    title: 'Enquete Publicada com Sucesso!',
    fields: [
      { name: 'Título', value: titulo },
      { name: 'Canal', value: `${targetChannel}` },
      {
        name: 'Link para Votação',
        value: `[Clique aqui](https://discord.com/channels/${guildId}/${targetChannel.id}/${messageId})`,
      },
    ],
    footer: 'A enquete está ativa e aceitando votos',
  });
}

function buildMensalistaToggleEmbed({ username, added, viaContext = false }) {
  if (added) {
    return buildEmbed({
      color: COLORS.SUCCESS,
      title: viaContext ? 'MENSALISTA ADICIONADO' : '✅ MENSALISTA ADICIONADO',
      description: viaContext
        ? `${username} foi adicionado a lista de mensalistas.`
        : `${username} foi adicionado à lista de mensalistas!`,
      fields: [
        {
          name: 'Benefício',
          value: viaContext
            ? 'Votos com peso 2 para este usuário.'
            : 'Seus votos agora contam como peso 2 (dobrado!) 📈',
          inline: false,
        },
      ],
      footer: viaContext ? undefined : 'Parabéns! 🎉',
    });
  }

  return buildEmbed({
    color: '#FF6600',
    title: viaContext ? 'MENSALISTA REMOVIDO' : '❌ MENSALISTA REMOVIDO',
    description: viaContext
      ? `${username} foi removido da lista de mensalistas.`
      : `${username} foi removido da lista de mensalistas.`,
    fields: [
      {
        name: 'Mudança',
        value: viaContext
          ? 'Votos com peso 1 para este usuário.'
          : 'Seus futuros votos contarão como peso 1 novamente.',
        inline: false,
      },
    ],
  });
}

function buildDraftOptionToggleEmbed({ acao, textoSelecionado, rascunho, cor }) {
  return buildEmbed({
    color: cor,
    title: `✅ OPÇÃO ${acao}`,
    description: `**"${textoSelecionado}"**`,
    fields: [
      { name: '📋 Rascunho', value: rascunho.titulo, inline: true },
      { name: '🔢 Total de Opções', value: `${rascunho.opcoes.length}/20`, inline: true },
      { name: '🗳️ Máximo de Votos', value: `${rascunho.maxVotos}`, inline: true },
    ],
    footer: `ID: ${rascunho.id}`,
  });
}

async function replyToInteraction(interaction, payload, options = {}) {
  const { ephemeral = false, edit = false } = options;
  const body = ephemeral && !payload.flags ? { ...payload, flags: MessageFlags.Ephemeral } : { ...payload };

  if (edit || (interaction.deferred && !interaction.replied)) {
    return interaction.editReply(body);
  }

  if (!interaction.replied && !interaction.deferred) {
    return interaction.reply(body);
  }

  return interaction.editReply(body);
}

async function replyPermissionDenied(interaction, options = {}) {
  const { MENSAGEM_PERMISSAO_NEGADA } = require('./permissions');
  return replyToInteraction(
    interaction,
    { content: MENSAGEM_PERMISSAO_NEGADA },
    { ephemeral: options.ephemeral !== false, edit: options.edit === true },
  );
}

async function replyValidationError(interaction, message, options = {}) {
  return replyToInteraction(
    interaction,
    { content: formatValidationError(message) },
    { ephemeral: options.ephemeral !== false, edit: options.edit === true },
  );
}

async function replyEphemeral(interaction, payload) {
  return replyToInteraction(interaction, payload, { ephemeral: true });
}

module.exports = {
  formatValidationError,
  formatDraftNotFound,
  formatDiscordMaxOptionsError,
  buildPollOptionsDescription,
  buildActivePollEmbed,
  embedWithMessageId,
  buildEmbed,
  buildDraftCreatedEmbed,
  buildDraftPublishedEmbed,
  buildMensalistaToggleEmbed,
  buildDraftOptionToggleEmbed,
  replyToInteraction,
  replyPermissionDenied,
  replyValidationError,
  replyEphemeral,
};
