const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, MessageFlags } = require('discord.js');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA } = require('../../utils/permissions');
const { loadVotacoes, saveVotacoes } = require('../../utils/file-handler');

/**
 * COMANDO DE CONTEXTO: Encerrar Votação
 * Aparece ao clicar com botão direito em uma mensagem
 * Encerra a votação se for uma enquete ativa
 */
module.exports = {
  data: new ContextMenuCommandBuilder().setName('Encerrar Votação').setType(ApplicationCommandType.Message),

  async execute(interaction, client) {
    const message = interaction.targetMessage;
    const messageId = message.id;

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

      // Verifica se a enquete existe
      const poll = client.activePolls.get(messageId);

      if (!poll) {
        return await interaction.reply({
          content: '❌ Esta mensagem não é uma enquete ativa! Certifique-se de clicar na mensagem correta da enquete.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Marca a enquete como finalizada
      poll.status = 'finalizada';
      poll.finalizadaEm = new Date();

      // ====================================
      // CÁLCULO DE VOTOS COM PESOS
      // ====================================

      // Inicializa contadores para cada opção
      const resultados = poll.opcoes.map((opcao, index) => ({
        opcao: opcao,
        emoji: poll.emojiNumeros[index],
        pontos: 0,
        votantes: [],
      }));

      // Conta os votos com peso
      for (const [userId, votoData] of Object.entries(poll.votos)) {
        const peso = votoData.peso;

        // Processa cada reação do usuário
        for (const emoji of votoData.reacoes) {
          const index = poll.emojiNumeros.indexOf(emoji);
          if (index !== -1) {
            resultados[index].pontos += peso;
            resultados[index].votantes.push(votoData.usuario);
          }
        }
      }

      // Ordena por pontos (decrescente)
      resultados.sort((a, b) => b.pontos - a.pontos);

      // Determina o vencedor
      const vencedor = resultados[0];
      const empate = resultados.filter((r) => r.pontos === vencedor.pontos).length > 1;

      let cor = empate ? '#FFFF00' : '#00FF00'; // Amarelo para empate, verde para vencedor único
      let tituloResultado = empate ? 'RESULTADO: EMPATE! 🤝' : 'VENCEDOR! 🏆';

      // ====================================
      // CRIAÇÃO DO EMBED DE RESULTADO
      // ====================================

      const resultEmbed = new EmbedBuilder()
        .setColor(cor)
        .setTitle('📊 RESULTADO FINAL DA VOTAÇÃO 📊')
        .setDescription(`${poll.titulo}\n\n${tituloResultado}`);

      // Adiciona ranking de opções (apenas top 3)
      const top3 = resultados.slice(0, 3);
      top3.forEach((resultado, index) => {
        const posicao = index === 0 && !empate ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
        resultEmbed.addFields({
          name: `${posicao} __**${resultado.opcao}**__`,
          value: `**${resultado.pontos} pontos** • ${resultado.votantes.length} votante(s)`,
          inline: false,
        });
      });

      // Lista de Mensalistas que Votaram
      let mensmentalList = '(nenhum)';
      try {
        const mensalistasQueVotaram = [];

        // Verifica quem realmente votou com peso 2 nesta enquete
        for (const [userId, votoData] of Object.entries(poll.votos)) {
          if (votoData?.peso === 2) {
            mensalistasQueVotaram.push(userId);
          }
        }

        if (mensalistasQueVotaram.length > 0) {
          // Busca os usuários e monta as menções
          const mencoes = [];
          for (const userId of mensalistasQueVotaram) {
            try {
              const user = await client.users.fetch(userId);
              mencoes.push(`<@${userId}>`);
            } catch (error) {
              console.log(`Não foi possível buscar usuário ${userId}`);
            }
          }

          if (mencoes.length > 0) {
            mensmentalList = mencoes.join(' ');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar mensalistas:', error);
      }

      // Adiciona a seção de mensalistas apenas se o peso de mensalista está ativado
      if (poll.usarPesoMensalista) {
        resultEmbed.addFields({
          name: '👑 Mensalistas que votaram:',
          value: `${mensmentalList}`,
          inline: false,
        });
      }

      resultEmbed
        .addFields(
          { name: '\u200B', value: '\u200B', inline: false },
          {
            name: 'ℹ️ Informações',
            value: `Total de participantes: ${Object.keys(poll.votos).length}\nLimite de votos: ${poll.maxVotos} por pessoa\n${poll.usarPesoMensalista ? 'Mensalistas contam como peso 2' : 'Peso igual para todos'}\n\n *Mostrando apenas o TOP 3*`,
            inline: false,
          },
        )
        .setFooter({
          text: 'Votação finalizada',
        })
        .setTimestamp();

      // Envia o resultado no canal
      await interaction.reply({
        embeds: [resultEmbed],
      });

      // Salva regist ao do resultado
      const historicoData = loadVotacoes();

      historicoData.push({
        titulo: poll.titulo,
        opcoes: poll.opcoes,
        maxVotos: poll.maxVotos,
        usarPesoMensalista: poll.usarPesoMensalista,
        resultados: resultados,
        vencedor: empate ? 'Empate' : vencedor.opcao,
        participantes: Object.keys(poll.votos).length,
        dataCriacao: poll.criadoEm,
        dataFinalizacao: poll.finalizadaEm,
      });

      saveVotacoes(historicoData);

      // Remove a enquete das votações ativas e salva
      client.activePolls.delete(messageId);
      client.saveActivePolls();

      console.log(`Votação finalizada via contexto: ${poll.titulo} | Vencedor: ${empate ? 'Empate' : vencedor.opcao}`);
    } catch (error) {
      console.error('Erro ao encerrar votação:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao encerrar a votação!',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
