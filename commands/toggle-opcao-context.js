const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../utils/permissions');
const { getLatestUserDraft, canEditDraft } = require('../utils/draft-handler');
const { COLORS } = require('../utils/constants');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Adicionar/Remover da enquete').setType(ApplicationCommandType.Message).setDefaultMemberPermissions(0),

  async execute(interaction, client) {
    try {
      // =====================================
      // VERIFICAÇÃO DE PERMISSÕES - SISTEMA BINÁRIO
      // Apenas usuários com o cargo Criador podem executar este comando
      // =====================================
      if (!isCriador(interaction.member, interaction.guildId)) {
        return await interaction.reply({
          content: MENSAGEM_PERMISSAO_NEGADA,
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
      if (!client.draftPolls) {
        console.error('❌ client.draftPolls não inicializado!');
        return await interaction.reply({
          content: '❌ Erro interno: Sistema de rascunhos não inicializado. Por favor, contate um Criador.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (client.draftPolls.size === 0) {
        return await interaction.reply({
          content: '❌ Nenhum rascunho encontrado! Crie um rascunho primeiro com `/rascunho criar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Busca o último rascunho do usuário
      const rascunho = getLatestUserDraft(client.draftPolls, interaction.user.id);

      if (!rascunho) {
        return await interaction.reply({
          content: '❌ Você não possui rascunhos! Crie um com `/rascunho criar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Validação extra de segurança
      if (!rascunho || !rascunho.opcoes || !Array.isArray(rascunho.opcoes)) {
        console.error('❌ Rascunho corrompido:', rascunho);
        return await interaction.reply({
          content: '❌ Erro: Rascunho corrompido. Por favor, crie um novo rascunho.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Verifica se a opção já existe (case-insensitive)
      const opcaoExistente = rascunho.opcoes.findIndex((op) => op.toLowerCase() === textoSelecionado.toLowerCase());

      let acao = '';
      let cor = '';

      if (opcaoExistente !== -1) {
        // Remover opção existente
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
        cor = COLORS.WARNING;
      } else {
        // Adicionar nova opção
        if (rascunho.opcoes.length >= 20) {
          return await interaction.reply({
            content: '❌ Limite atingido! O rascunho já possui 20 opções (máximo permitido).',
            flags: MessageFlags.Ephemeral,
          });
        }

        rascunho.opcoes.push(textoSelecionado);
        acao = 'ADICIONADA';
        cor = COLORS.SUCCESS;
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
      console.error('Stack trace:', error.stack);

      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ Erro ao processar o comando. Detalhes registrados no log.',
            flags: MessageFlags.Ephemeral,
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ Erro ao processar o comando. Detalhes registrados no log.',
          });
        }
      } catch (replyError) {
        console.error('❌ Erro ao enviar mensagem de erro:', replyError);
      }
    }
  },
};
