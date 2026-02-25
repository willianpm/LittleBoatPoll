const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

/**
 * COMANDO: /encerrar
 * Encerra a votação e calcula o resultado final
 *
 * LÓGICA DE PESO:
 * - Usuários mensalistas: peso 2
 * - Usuários comuns: peso 1
 *
 * PERMISSÃO: Apenas administradores podem usar este comando
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('encerrar')
    .setDescription('Encerra a votação e anuncia o resultado final')
    .addStringOption((option) => option.setName('mensagem_id').setDescription('ID da mensagem da enquete').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // ✅ Apenas admins

  async execute(interaction, client) {
    const messageId = interaction.options.getString('mensagem_id');

    try {
      // ✅ VERIFICAÇÃO EXTRA DE PERMISSÕES (redundância de segurança)
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: '❌ **Permissão negada!** Apenas administradores podem encerrar votações.',
          ephemeral: true,
        });
      }

      // Verifica se a enquete existe
      const poll = client.activePolls.get(messageId);

      if (!poll) {
        return await interaction.reply({
          content: '❌ Enquete não encontrada! Certifique-se de que o ID está correto.',
          ephemeral: true,
        });
      }

      // Marca a enquete como finalizada
      poll.status = 'finalizada';
      poll.finalizadaEm = new Date();

      // ====================================
      // CÁLCULO DE VOTOS COM PESOS
      // ====================================

      // Carrega a lista de mensalistas
      const mensalistasData = JSON.parse(fs.readFileSync('./mensalistas.json', 'utf8'));

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
      let tituloResultado = empate ? '🤝 RESULTADO: EMPATE!' : '🏆 VENCEDOR!';

      // ====================================
      // CRIAÇÃO DO EMBED DE RESULTADO
      // ====================================

      const resultEmbed = new EmbedBuilder().setColor(cor).setTitle('📊 RESULTADO FINAL DA VOTAÇÃO 📊').setDescription(`**${poll.titulo}**\n\n${tituloResultado}`);

      // Adiciona ranking de opções (apenas top 3)
      const top3 = resultados.slice(0, 3);
      top3.forEach((resultado, index) => {
        const posicao = index === 0 && !empate ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
        const destaque = index === 0 && !empate ? '**' : '';
        resultEmbed.addFields({
          name: `${posicao} ${destaque}${resultado.opcao}${destaque}`,
          value: `**${resultado.pontos} pontos** • ${resultado.votantes.length} votante(s)`,
          inline: false,
        });
      });

      // ====================================
      // LISTA DE MENSALISTAS QUE VOTARAM
      // ====================================
      let mensmentalList = '(nenhum)';
      try {
        const mensalistasData = JSON.parse(fs.readFileSync('./mensalistas.json', 'utf8'));
        const mensalistasQueVotaram = [];

        // Verifica quais mensalistas votaram
        for (const userId of mensalistasData.mensalistas) {
          if (poll.votos[userId]) {
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

      resultEmbed.addFields({
        name: '👑 Mensalistas que votaram',
        value: `Mensalistas: ${mensmentalList}`,
        inline: false,
      });

      resultEmbed
        .addFields(
          { name: '\u200B', value: '\u200B', inline: false },
          {
            name: 'ℹ️ Informações',
            value: `📊 Total de participantes: ${Object.keys(poll.votos).length}\n⚖️ Limite de votos: ${poll.maxVotos} por pessoa\n${poll.usarPesoMensalista ? '👑 Mensalistas contam como peso 2' : '⚖️ Peso igual para todos'}\n\n💡 *Mostrando apenas o TOP 3*`,
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

      // ====================================
      // SALVA O RESULTADO (OPCIONAL)
      // ====================================

      // Você pode salvar este resultado em um arquivo ou banco de dados
      const historicoFilePath = './historico-votacoes.json';
      let historico = [];

      if (fs.existsSync(historicoFilePath)) {
        historico = JSON.parse(fs.readFileSync(historicoFilePath, 'utf8'));
      }

      historico.push({
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

      fs.writeFileSync(historicoFilePath, JSON.stringify(historico, null, 2));

      // Remove a enquete das votações ativas e salva
      client.activePolls.delete(messageId);

      // Salva as votações ativas atualizadas
      const saveActivePolls = () => {
        try {
          const pollsArray = Array.from(client.activePolls.entries());
          fs.writeFileSync('./active-polls.json', JSON.stringify(pollsArray, null, 2));
        } catch (error) {
          console.error('❌ Erro ao salvar votações:', error);
        }
      };
      saveActivePolls();

      console.log(`✅ Votação finalizada: ${poll.titulo} | Vencedor: ${empate ? 'Empate' : vencedor.opcao}`);
    } catch (error) {
      console.error('❌ Erro ao encerrar votação:', error);
      await interaction.reply({
        content: '❌ Erro ao encerrar a votação!',
        ephemeral: true,
      });
    }
  },
};
