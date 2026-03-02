const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../../utils/permissions');
const { validatePollOptions, parseOptions } = require('../../utils/validators');
const { EMOJIS_DISPONIVEIS, COLORS, LIMITS } = require('../../utils/constants');

/**
 * COMANDO: /enquete
 * Cria uma nova enquete para votação do Clube do Livro
 *
 * Opções:
 * - titulo (obrigatório): Título da enquete
 * - opcoes (obrigatório): Opções separadas por vírgula
 * - max_votos (obrigatório): Número máximo de votos por pessoa
 * - peso_mensalista (obrigatório): Mensalistas têm peso duplo?
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
        .setDescription('Opções separadas por vírgula (ex: Livro A, Livro B, Livro C)')
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
    // Defer reply IMEDIATAMENTE para evitar timeout (3s do Discord)
    await interaction.deferReply();

    try {
      // Coleta as informações
      const titulo = interaction.options.getString('nome-da-enquete');
      const opcoesString = interaction.options.getString('opcoes');
      const maxVotos = interaction.options.getInteger('max_votos') || 1;
      const pesoMensalistaOption = interaction.options.getString('peso_mensalista');
      const usarPesoMensalista = pesoMensalistaOption === 'sim';

      // Processa as opções
      const opcoes = parseOptions(opcoesString);

      // Valida opções
      const validation = validatePollOptions(opcoes, maxVotos);
      if (!validation.valid) {
        return await interaction.editReply({
          content: `❌ **Erro!** ${validation.error}`,
        });
      }

      // =====================================
      // VERIFICAÇÃO DE PERMISSÕES - SISTEMA BINÁRIO
      // Apenas usuários com o cargo Criador podem executar este comando
      // =====================================
      if (!isCriador(interaction.member, interaction.guildId)) {
        return await interaction.editReply({
          content: MENSAGEM_PERMISSAO_NEGADA,
        });
      }

      // Emojis para as opções (letras circuladas)
      // Discord limita a 20 reações por mensagem
      const emojiNumeros = EMOJIS_DISPONIVEIS.slice(0, opcoes.length);

      // Verifica se há emojis suficientes (limite do Discord: 20 reações)
      if (opcoes.length > LIMITS.MAX_OPTIONS) {
        return await interaction.editReply({
          content:
            '❌ **Erro!** O Discord limita a 20 reações por mensagem. ' +
            `Máximo: ${LIMITS.MAX_OPTIONS} opções por enquete.`,
        });
      }

      // Constrói a descrição com as opções
      let descricao = `Selecione até ${maxVotos} opç${maxVotos > 1 ? 'ões' : 'ão'}:\n\n`;
      opcoes.forEach((opcao, index) => {
        descricao += `**${emojiNumeros[index]} ${opcao}**\n\n`;
      });

      // Cria um Embed bonito para a enquete
      const pesoInfo = usarPesoMensalista ? 'Mensalistas têm peso 2 nos votos' : 'Todos têm o mesmo peso';
      const pollEmbed = new EmbedBuilder()
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

      // Envia a mensagem com o embed (usando editReply porque já fizemos defer)
      await interaction.editReply({
        embeds: [pollEmbed],
      });

      // Busca a mensagem para obter o ID e poder adicionar reações
      const msg = await interaction.fetchReply();

      // Atualiza o embed para incluir o ID
      const updatedEmbed = EmbedBuilder.from(pollEmbed).addFields({ name: 'ID', value: `${msg.id}`, inline: false });

      await interaction.editReply({ embeds: [updatedEmbed] });

      // Adiciona as reações (apenas os emojis necessários)
      for (let i = 0; i < opcoes.length; i++) {
        await msg.react(emojiNumeros[i]);
      }

      // Inicializa a votação ativa em memória
      client.activePolls.set(msg.id, {
        messageId: msg.id,
        channelId: interaction.channelId,
        titulo: titulo,
        opcoes: opcoes,
        emojiNumeros: emojiNumeros.slice(0, opcoes.length),
        maxVotos: maxVotos,
        usarPesoMensalista: usarPesoMensalista,
        criadoEm: new Date(),
        votos: {}, // userId -> { reacoes: [emoji1, emoji2], peso: 2 ou 1 }
        status: 'ativa',
      });

      // Salva as votações ativas em arquivo
      client.saveActivePolls();

      console.log(
        `Enquete criada: ${titulo} | ${opcoes.length} opções | Max ${maxVotos} votos | ` +
          `Peso mensalista: ${usarPesoMensalista ? 'SIM' : 'NÃO'} | ID: ${msg.id}`,
      );
    } catch (error) {
      console.error('Erro ao criar enquete:', error);
      await interaction.editReply({
        content: '❌ Erro ao criar a enquete!',
      });
    }
  },
};
