const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

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
    .addStringOption((option) => option.setName('nome-da-enquete').setDescription('Nome/Título da enquete').setRequired(true))
    .addStringOption((option) => option.setName('opcoes').setDescription('Opções separadas por vírgula (ex: Livro A, Livro B, Livro C)').setRequired(true))
    .addIntegerOption((option) => option.setName('max_votos').setDescription('Número máximo de votos por pessoa').setRequired(true).setMinValue(1))
    .addStringOption((option) => option.setName('peso_mensalista').setDescription('Mensalistas têm peso 2 nos votos?').setRequired(true).addChoices({ name: 'Sim - Peso 2', value: 'sim' }, { name: 'Não - Peso 1', value: 'nao' })),

  async execute(interaction, client) {
    // Coleta as informações
    const titulo = interaction.options.getString('nome-da-enquete');
    const opcoesString = interaction.options.getString('opcoes');
    const maxVotos = interaction.options.getInteger('max_votos') || 1;
    const pesoMensalistaOption = interaction.options.getString('peso_mensalista');
    const usarPesoMensalista = pesoMensalistaOption === 'sim';

    // Processa as opções (separa por vírgula e limpa espaços)
    const opcoes = opcoesString
      .split(',')
      .map((op) => op.trim())
      .filter((op) => op.length > 0);

    // Valida número de opções
    if (opcoes.length < 2) {
      return await interaction.reply({
        content: '❌ **Erro!** A enquete precisa ter pelo menos 2 opções.',
        ephemeral: true,
      });
    }

    // Valida max_votos
    if (maxVotos > opcoes.length) {
      return await interaction.reply({
        content: `❌ **Erro!** O número máximo de votos (${maxVotos}) não pode ser maior que o número de opções (${opcoes.length}).`,
        ephemeral: true,
      });
    }

    // =====================================
    // VERIFICAÇÃO DE PERMISSÕES
    // =====================================
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    // Carrega os cargos permitidos
    let cargosPermitidos = [];
    if (fs.existsSync('./cargos-criadores.json')) {
      const data = JSON.parse(fs.readFileSync('./cargos-criadores.json', 'utf8'));
      cargosPermitidos = data.cargos || [];
    }

    // Verifica se o usuário tem algum cargo permitido
    const temCargoPermitido = interaction.member.roles.cache.some((role) => cargosPermitidos.includes(role.id));

    // Se não é admin e não tem cargo permitido, nega
    if (!isAdmin && !temCargoPermitido) {
      return await interaction.reply({
        content: '❌ **Permissão negada!** Apenas administradores ou membros com cargos autorizados podem criar enquetes.',
        ephemeral: true,
      });
    }

    try {
      // Emojis para as opções (letras circuladas)
      // Discord limita a 20 reações por mensagem
      const emojisDisponiveis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'];

      // Verifica se há emojis suficientes (limite do Discord: 20 reações)
      if (opcoes.length > 20) {
        return await interaction.reply({
          content: '❌ **Erro!** O Discord limita a 20 reações por mensagem. Máximo: 20 opções por enquete.',
          ephemeral: true,
        });
      }

      const emojiNumeros = emojisDisponiveis.slice(0, opcoes.length);

      // Constrói a descrição com as opções
      let descricao = `Selecione até ${maxVotos} opç${maxVotos > 1 ? 'ões' : 'ão'}:\n\n`;
      opcoes.forEach((opcao, index) => {
        descricao += `**${emojiNumeros[index]} ${opcao}**\n\n`;
      });

      // Cria um Embed bonito para a enquete
      const pesoInfo = usarPesoMensalista ? 'Mensalistas têm peso 2 nos votos' : 'Todos têm o mesmo peso';
      const pollEmbed = new EmbedBuilder()
        .setColor('#FFD700') // Ouro
        .setTitle(`${titulo} 📚`)
        .setDescription(descricao)
        .addFields({ name: '\u200B', value: '\u200B', inline: false }, { name: 'Regras 📊', value: `• Você pode votar em até ${maxVotos} opç${maxVotos > 1 ? 'ões' : 'ão'}\n\n• ${pesoInfo}`, inline: false })
        .setFooter({ text: `${opcoes.length} opções disponíveis` })
        .setTimestamp();

      // Envia a mensagem com o embed
      await interaction.reply({
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
      const saveActivePolls = () => {
        try {
          const pollsArray = Array.from(client.activePolls.entries());
          fs.writeFileSync('./active-polls.json', JSON.stringify(pollsArray, null, 2));
        } catch (error) {
          console.error('❌ Erro ao salvar votações:', error);
        }
      };
      saveActivePolls();

      console.log(`✅ Enquete criada: ${titulo} | ${opcoes.length} opções | Max ${maxVotos} votos | Peso mensalista: ${usarPesoMensalista ? 'SIM' : 'NÃO'} | ID: ${msg.id}`);
    } catch (error) {
      console.error('❌ Erro ao criar enquete:', error);
      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Erro ao criar a enquete!',
          ephemeral: true,
        });
      }
    }
  },
};
