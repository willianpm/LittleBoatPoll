const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Toggle Opção em Rascunho').setType(ApplicationCommandType.Message).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      // Verifica permissões
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      let cargosPermitidos = [];
      if (fs.existsSync('./cargos-criadores.json')) {
        const data = JSON.parse(fs.readFileSync('./cargos-criadores.json', 'utf8'));
        cargosPermitidos = data.cargos || [];
      }

      const temCargoPermitido = interaction.member.roles.cache.some((role) => cargosPermitidos.includes(role.id));

      if (!isAdmin && !temCargoPermitido) {
        return await interaction.reply({
          content: '❌ Permissão negada! Apenas administradores ou membros autorizados podem gerenciar rascunhos.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Extrai o texto da mensagem selecionada
      const textoSelecionado = interaction.targetMessage.content.trim();

      if (!textoSelecionado || textoSelecionado.length === 0) {
        return await interaction.reply({
          content: '❌ A mensagem selecionada não contém texto válido.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (textoSelecionado.length > 100) {
        return await interaction.reply({
          content: '❌ O texto selecionado é muito longo! Máximo: 100 caracteres.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Carrega os rascunhos
      if (!client.draftPolls || client.draftPolls.size === 0) {
        return await interaction.reply({
          content: '❌ Nenhum rascunho encontrado! Crie um rascunho primeiro com `/rascunho criar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Busca o último rascunho do usuário
      const userDrafts = Array.from(client.draftPolls.values())
        .filter((draft) => draft.criadorId === interaction.user.id)
        .sort((a, b) => new Date(b.editadoEm || b.criadoEm) - new Date(a.editadoEm || a.criadoEm));

      if (userDrafts.length === 0) {
        return await interaction.reply({
          content: '❌ Você não possui rascunhos! Crie um com `/rascunho criar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const rascunho = userDrafts[0];

      // Verifica se a opção já existe (case-insensitive)
      const opcaoExistente = rascunho.opcoes.findIndex((op) => op.toLowerCase() === textoSelecionado.toLowerCase());

      let acao = '';
      let cor = '';

      if (opcaoExistente !== -1) {
        // REMOVER opção existente
        rascunho.opcoes.splice(opcaoExistente, 1);

        // Valida que ainda tem pelo menos 2 opções
        if (rascunho.opcoes.length < 2) {
          return await interaction.reply({
            content: '❌ Não é possível remover! O rascunho precisa ter pelo menos 2 opções.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Ajusta max_votos se necessário
        if (rascunho.maxVotos > rascunho.opcoes.length) {
          rascunho.maxVotos = rascunho.opcoes.length;
        }

        acao = 'REMOVIDA';
        cor = '#FF6600';
      } else {
        // ADICIONAR nova opção
        if (rascunho.opcoes.length >= 20) {
          return await interaction.reply({
            content: '❌ Limite atingido! O rascunho já possui 20 opções (máximo permitido).',
            flags: MessageFlags.Ephemeral,
          });
        }

        rascunho.opcoes.push(textoSelecionado);
        acao = 'ADICIONADA';
        cor = '#00FF00';
      }

      // Atualiza timestamp
      rascunho.editadoEm = new Date().toISOString();

      // Salva no cliente e no arquivo
      client.draftPolls.set(rascunho.id, rascunho);
      if (client.saveDraftPolls) {
        client.saveDraftPolls();
      }

      // Resposta com embed
      const embed = new EmbedBuilder()
        .setColor(cor)
        .setTitle(`✅ OPÇÃO ${acao}`)
        .setDescription(`**"${textoSelecionado}"**`)
        .addFields({ name: '📋 Rascunho', value: rascunho.titulo, inline: true }, { name: '🔢 Total de Opções', value: `${rascunho.opcoes.length}/20`, inline: true }, { name: '🗳️ Máximo de Votos', value: `${rascunho.maxVotos}`, inline: true })
        .setFooter({ text: `ID: ${rascunho.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

      console.log(`✅ Opção ${acao.toLowerCase()} via context menu: "${textoSelecionado}" (Rascunho: ${rascunho.id})`);
    } catch (error) {
      console.error('❌ Erro ao processar toggle de opção (context menu):', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao processar o comando.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
