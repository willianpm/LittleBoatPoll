const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const crypto = require('crypto');

/**
 * COMANDO: /rascunho
 * Gerencia rascunhos de enquetes (draft polls)
 *
 * Subcomandos:
 * - criar: Cria um novo rascunho de enquete
 * - editar: Edita um rascunho existente
 * - adicionar-opcao: Adiciona opções ao rascunho sem remover as existentes
 * - remover-opcao: Remove uma opção específica do rascunho
 * - listar: Lista todos os rascunhos do usuário ou servidor
 * - exibir: Mostra detalhes de um rascunho específico
 * - publicar: Publica um rascunho como enquete ativa
 * - deletar: Remove um rascunho
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rascunho')
    .setDescription('Gerencia rascunhos de enquetes para futuras votações')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('criar')
        .setDescription('Cria um novo rascunho de enquete')
        .addStringOption((option) => option.setName('titulo').setDescription('Título da enquete').setRequired(true))
        .addStringOption((option) => option.setName('opcoes').setDescription('Opções separadas por vírgula (ex: Livro A, Livro B, Livro C)').setRequired(true))
        .addIntegerOption((option) => option.setName('max_votos').setDescription('Número máximo de votos por pessoa').setRequired(true).setMinValue(1))
        .addStringOption((option) => option.setName('peso_mensalista').setDescription('Mensalistas têm peso 2 nos votos?').setRequired(false).addChoices({ name: 'Sim - Peso 2', value: 'sim' }, { name: 'Não - Peso 1', value: 'nao' })),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('editar')
        .setDescription('Edita um rascunho existente')
        .addStringOption((option) => option.setName('id').setDescription('ID do rascunho a editar').setRequired(true))
        .addStringOption((option) => option.setName('titulo').setDescription('Novo título (deixe em branco para manter)').setRequired(false))
        .addStringOption((option) => option.setName('opcoes').setDescription('Novas opções (deixe em branco para manter)').setRequired(false))
        .addIntegerOption((option) => option.setName('max_votos').setDescription('Novo máximo de votos').setRequired(false).setMinValue(1))
        .addStringOption((option) => option.setName('peso_mensalista').setDescription('Mudar peso de mensalistas?').setRequired(false).addChoices({ name: 'Sim - Peso 2', value: 'sim' }, { name: 'Não - Peso 1', value: 'nao' })),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('adicionar-opcao')
        .setDescription('Adiciona uma ou mais opções ao rascunho')
        .addStringOption((option) => option.setName('id').setDescription('ID do rascunho').setRequired(true))
        .addStringOption((option) => option.setName('opcoes').setDescription('Novas opções separadas por vírgula (ex: Livro D, Livro E)').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remover-opcao')
        .setDescription('Remove uma opção específica do rascunho')
        .addStringOption((option) => option.setName('id').setDescription('ID do rascunho').setRequired(true))
        .addStringOption((option) => option.setName('opcao').setDescription('Texto da opção a remover (ex: Livro A) ou número (ex: 1)').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('listar').setDescription('Lista os rascunhos disponíveis'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('exibir')
        .setDescription('Mostra os detalhes de um rascunho')
        .addStringOption((option) => option.setName('id').setDescription('ID do rascunho').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('publicar')
        .setDescription('Publica um rascunho como enquete ativa')
        .addStringOption((option) => option.setName('id').setDescription('ID do rascunho a publicar').setRequired(true))
        .addChannelOption((option) => option.setName('canal').setDescription('Canal onde a enquete será publicada (padrão: canal atual)').setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('deletar')
        .setDescription('Remove um rascunho')
        .addStringOption((option) => option.setName('id').setDescription('ID do rascunho a deletar').setRequired(true)),
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

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

    // Se não é admin e não tem cargo permitido, nega para criar/editar
    if ((subcommand === 'criar' || subcommand === 'editar' || subcommand === 'adicionar-opcao' || subcommand === 'remover-opcao' || subcommand === 'deletar' || subcommand === 'publicar') && !isAdmin && !temCargoPermitido) {
      return await interaction.reply({
        content: '❌ **Permissão negada!** Apenas administradores ou membros com cargos autorizados podem gerenciar enquetes.',
        ephemeral: true,
      });
    }

    try {
      if (subcommand === 'criar') await handleCriar(interaction, client);
      else if (subcommand === 'editar') await handleEditar(interaction, client);
      else if (subcommand === 'adicionar-opcao') await handleAdicionarOpcao(interaction, client);
      else if (subcommand === 'remover-opcao') await handleRemoverOpcao(interaction, client);
      else if (subcommand === 'listar') await handleListar(interaction, client);
      else if (subcommand === 'exibir') await handleExibir(interaction, client);
      else if (subcommand === 'publicar') await handlePublicar(interaction, client);
      else if (subcommand === 'deletar') await handleDeletar(interaction, client);
    } catch (error) {
      console.error('❌ Erro ao gerenciar rascunho:', error);
      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Erro ao processar o comando!',
          ephemeral: true,
        });
      }
    }
  },
};

// =====================================
// HANDLERS DOS SUBCOMANDOS
// =====================================

async function handleCriar(interaction, client) {
  const titulo = interaction.options.getString('titulo');
  const opcoesString = interaction.options.getString('opcoes');
  const maxVotos = interaction.options.getInteger('max_votos') || 1;
  const pesoMensalistaOption = interaction.options.getString('peso_mensalista') || 'nao';
  const usarPesoMensalista = pesoMensalistaOption === 'sim';

  // Processa as opções
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

  // Valida número de opções (Discord limita a 20 reações)
  if (opcoes.length > 20) {
    return await interaction.reply({
      content: '❌ **Erro!** O Discord limita a 20 reações por mensagem. Máximo: 20 opções por enquete.',
      ephemeral: true,
    });
  }

  // Gera um ID único para o rascunho
  const draftId = crypto.randomBytes(4).toString('hex').toUpperCase();

  // Cria o rascunho
  const draft = {
    id: draftId,
    titulo: titulo,
    opcoes: opcoes,
    maxVotos: maxVotos,
    usarPesoMensalista: usarPesoMensalista,
    criadorId: interaction.user.id,
    criadorNome: interaction.user.username,
    criadoEm: new Date().toISOString(),
    editadoEm: new Date().toISOString(),
    status: 'rascunho',
  };

  // Armazena em memória
  client.draftPolls.set(draftId, draft);

  // Salva em arquivo
  const saveFunc = () => {
    try {
      const draftsArray = Array.from(client.draftPolls.values());
      fs.writeFileSync('./draft-polls.json', JSON.stringify(draftsArray, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar rascunho:', error);
    }
  };
  saveFunc();

  // Cria o embed de confirmação
  const confirmEmbed = new EmbedBuilder()
    .setColor('#87CEEB')
    .setTitle('✅ Rascunho Criado com Sucesso!')
    .addFields(
      { name: 'ID do Rascunho', value: `\`${draftId}\`` },
      { name: 'Título', value: titulo },
      { name: 'Opções', value: opcoes.join(', ') },
      { name: 'Máximo de Votos', value: `${maxVotos}`, inline: true },
      { name: 'Peso Mensalista', value: usarPesoMensalista ? 'Sim (2x)' : 'Não (1x)', inline: true },
      {
        name: 'Próximos Passos',
        value: `
• Use \`/rascunho editar\` para fazer alterações
• Use \`/rascunho exibir\` para visualizar os detalhes
• Use \`/rascunho publicar\` para ativar a enquete para votação
        `,
      },
    )
    .setFooter({ text: 'Status: 📝 Rascunho (não publicado)' })
    .setTimestamp();

  await interaction.reply({
    embeds: [confirmEmbed],
    ephemeral: true,
  });

  console.log(`✅ Rascunho criado: ${titulo} | ID: ${draftId} | Criador: ${interaction.user.tag}`);
}

async function handleEditar(interaction, client) {
  const draftId = interaction.options.getString('id');

  // Verifica se o rascunho existe
  const draft = client.draftPolls.get(draftId);
  if (!draft) {
    return await interaction.reply({
      content: `❌ **Erro!** Rascunho com ID \`${draftId}\` não encontrado.`,
      ephemeral: true,
    });
  }

  // Verifica se o usuário é o criador ou admin
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (draft.criadorId !== interaction.user.id && !isAdmin) {
    return await interaction.reply({
      content: '❌ **Permissão negada!** Apenas o criador ou administrador podem editar este rascunho.',
      ephemeral: true,
    });
  }

  // Coleta as edições
  const novoTitulo = interaction.options.getString('titulo');
  const novasOpcoesString = interaction.options.getString('opcoes');
  const novoMaxVotos = interaction.options.getInteger('max_votos');
  const novoPesoOption = interaction.options.getString('peso_mensalista');

  // Atualiza o título se fornecido
  if (novoTitulo) {
    draft.titulo = novoTitulo;
  }

  // Atualiza as opções se fornecidas
  if (novasOpcoesString) {
    const novasOpcoes = novasOpcoesString
      .split(',')
      .map((op) => op.trim())
      .filter((op) => op.length > 0);

    if (novasOpcoes.length < 2) {
      return await interaction.reply({
        content: '❌ **Erro!** A enquete precisa ter pelo menos 2 opções.',
        ephemeral: true,
      });
    }

    if (novasOpcoes.length > 20) {
      return await interaction.reply({
        content: '❌ **Erro!** O Discord limita a 20 reações por mensagem. Máximo: 20 opções por enquete.',
        ephemeral: true,
      });
    }

    draft.opcoes = novasOpcoes;
  }

  // Atualiza max_votos se fornecido
  if (novoMaxVotos) {
    if (novoMaxVotos > draft.opcoes.length) {
      return await interaction.reply({
        content: `❌ **Erro!** O número máximo de votos (${novoMaxVotos}) não pode ser maior que o número de opções (${draft.opcoes.length}).`,
        ephemeral: true,
      });
    }
    draft.maxVotos = novoMaxVotos;
  }

  // Atualiza peso mensalista se fornecido
  if (novoPesoOption) {
    draft.usarPesoMensalista = novoPesoOption === 'sim';
  }

  // Atualiza timestamp de edição
  draft.editadoEm = new Date().toISOString();

  // Salva a alteração
  client.draftPolls.set(draftId, draft);
  const saveFunc = () => {
    try {
      const draftsArray = Array.from(client.draftPolls.values());
      fs.writeFileSync('./draft-polls.json', JSON.stringify(draftsArray, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar rascunho:', error);
    }
  };
  saveFunc();

  // Cria o embed de confirmação
  const updateEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('✅ Rascunho Atualizado!')
    .addFields({ name: 'ID', value: `\`${draftId}\`` }, { name: 'Título', value: draft.titulo }, { name: 'Opções', value: draft.opcoes.join(', ') }, { name: 'Máximo de Votos', value: `${draft.maxVotos}`, inline: true }, { name: 'Peso Mensalista', value: draft.usarPesoMensalista ? 'Sim (2x)' : 'Não (1x)', inline: true })
    .setFooter({ text: 'Status: 📝 Rascunho' })
    .setTimestamp();

  await interaction.reply({
    embeds: [updateEmbed],
    ephemeral: true,
  });

  console.log(`✅ Rascunho editado: ${draft.titulo} | ID: ${draftId}`);
}

async function handleListar(interaction, client) {
  if (client.draftPolls.size === 0) {
    return await interaction.reply({
      content: '📝 Não há rascunhos de enquetes no momento.',
      ephemeral: true,
    });
  }

  // Cria um array de valores
  const draftsArray = Array.from(client.draftPolls.values());

  // Limita a 10 rascunhos por embed (limite do Discord)
  const draftsToShow = draftsArray.slice(0, 10);

  let descricao = '';
  draftsToShow.forEach((draft) => {
    descricao += `
**ID:** \`${draft.id}\`
**Título:** ${draft.titulo}
**Opções:** ${draft.opcoes.length}
**Criador:** <@${draft.criadorId}>
**Criado em:** <t:${Math.floor(new Date(draft.criadoEm).getTime() / 1000)}:f>
---
`;
  });

  const listEmbed = new EmbedBuilder()
    .setColor('#87CEEB')
    .setTitle(`📝 Rascunhos de Enquetes (${draftsArray.length})`)
    .setDescription(descricao || 'Nenhum rascunho encontrado')
    .setFooter({ text: `Exibindo ${draftsToShow.length} de ${draftsArray.length}` })
    .setTimestamp();

  await interaction.reply({
    embeds: [listEmbed],
    ephemeral: true,
  });
}

async function handleExibir(interaction, client) {
  const draftId = interaction.options.getString('id');

  const draft = client.draftPolls.get(draftId);
  if (!draft) {
    return await interaction.reply({
      content: `❌ **Erro!** Rascunho com ID \`${draftId}\` não encontrado.`,
      ephemeral: true,
    });
  }

  // Constrói a descrição com as opções
  let descricao = `Opções:\n\n`;
  draft.opcoes.forEach((opcao, index) => {
    descricao += `**${index + 1}.** ${opcao}\n`;
  });

  const pesoInfo = draft.usarPesoMensalista ? 'Mensalistas têm peso 2 nos votos' : 'Todos têm o mesmo peso';

  const detailEmbed = new EmbedBuilder()
    .setColor('#87CEEB')
    .setTitle(`📝 ${draft.titulo}`)
    .setDescription(descricao)
    .addFields({ name: 'ID do Rascunho', value: `\`${draftId}\`` }, { name: 'Criador', value: `<@${draft.criadorId}>`, inline: true }, { name: 'Máximo de Votos', value: `${draft.maxVotos}`, inline: true }, { name: 'Peso Mensalista', value: pesoInfo, inline: true }, { name: 'Criado em', value: `<t:${Math.floor(new Date(draft.criadoEm).getTime() / 1000)}:f>` }, { name: 'Editado em', value: `<t:${Math.floor(new Date(draft.editadoEm).getTime() / 1000)}:f>` }, { name: 'Status', value: '📝 Rascunho (não publicado)' })
    .setFooter({ text: `Total de opções: ${draft.opcoes.length}` })
    .setTimestamp();

  await interaction.reply({
    embeds: [detailEmbed],
    ephemeral: true,
  });
}

async function handlePublicar(interaction, client) {
  const draftId = interaction.options.getString('id');
  const canalEscolhido = interaction.options.getChannel('canal');

  const draft = client.draftPolls.get(draftId);
  if (!draft) {
    return await interaction.reply({
      content: `❌ **Erro!** Rascunho com ID \`${draftId}\` não encontrado.`,
      ephemeral: true,
    });
  }

  // Verifica se o usuário é o criador ou admin
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (draft.criadorId !== interaction.user.id && !isAdmin) {
    return await interaction.reply({
      content: '❌ **Permissão negada!** Apenas o criador ou administrador podem publicar este rascunho.',
      ephemeral: true,
    });
  }

  try {
    // Define o canal (usado o escolhido ou o canal atual)
    const targetChannel = canalEscolhido || interaction.channel;

    // Emojis para as opções
    const emojisDisponiveis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'];
    const emojiNumeros = emojisDisponiveis.slice(0, draft.opcoes.length);

    // Constrói a descrição com as opções
    let descricaoPoll = `Selecione até ${draft.maxVotos} opç${draft.maxVotos > 1 ? 'ões' : 'ão'}:\n\n`;
    draft.opcoes.forEach((opcao, index) => {
      descricaoPoll += `**${emojiNumeros[index]} ${opcao}**\n\n`;
    });

    // Cria o embed da enquete
    const pesoInfo = draft.usarPesoMensalista ? 'Mensalistas têm peso 2 nos votos' : 'Todos têm o mesmo peso';
    const pollEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`${draft.titulo} 📚`)
      .setDescription(descricaoPoll)
      .addFields({ name: '\u200B', value: '\u200B', inline: false }, { name: 'Regras 📊', value: `• Você pode votar em até ${draft.maxVotos} opç${draft.maxVotos > 1 ? 'ões' : 'ão'}\n\n• ${pesoInfo}`, inline: false })
      .setFooter({ text: `${draft.opcoes.length} opções disponíveis` })
      .setTimestamp();

    // Envia a mensagem no canal alvo
    const msg = await targetChannel.send({
      embeds: [pollEmbed],
    });

    // Atualiza o embed para incluir o ID
    const updatedEmbed = EmbedBuilder.from(pollEmbed).addFields({ name: 'ID', value: `${msg.id}`, inline: false });
    await msg.edit({ embeds: [updatedEmbed] });

    // Adiciona as reações
    for (let i = 0; i < draft.opcoes.length; i++) {
      await msg.react(emojiNumeros[i]);
    }

    // Cria a enquete ativa em memória
    client.activePolls.set(msg.id, {
      messageId: msg.id,
      channelId: targetChannel.id,
      titulo: draft.titulo,
      opcoes: draft.opcoes,
      emojiNumeros: emojiNumeros.slice(0, draft.opcoes.length),
      maxVotos: draft.maxVotos,
      usarPesoMensalista: draft.usarPesoMensalista,
      criadoEm: new Date(),
      votos: {},
      status: 'ativa',
    });

    // Salva as votações ativas
    const saveActiveFunc = () => {
      try {
        const pollsArray = Array.from(client.activePolls.entries());
        fs.writeFileSync('./active-polls.json', JSON.stringify(pollsArray, null, 2));
      } catch (error) {
        console.error('❌ Erro ao salvar votações:', error);
      }
    };
    saveActiveFunc();

    // Remove o rascunho
    client.draftPolls.delete(draftId);

    // Salva os rascunhos (agora sem o publicado)
    const saveDraftFunc = () => {
      try {
        const draftsArray = Array.from(client.draftPolls.values());
        fs.writeFileSync('./draft-polls.json', JSON.stringify(draftsArray, null, 2));
      } catch (error) {
        console.error('❌ Erro ao salvar rascunhos:', error);
      }
    };
    saveDraftFunc();

    // Confirmação
    const publishEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Enquete Publicada com Sucesso!')
      .addFields({ name: 'Título', value: draft.titulo }, { name: 'Canal', value: `${targetChannel}` }, { name: 'Link para Votação', value: `[Clique aqui](https://discord.com/channels/${interaction.guildId}/${targetChannel.id}/${msg.id})` })
      .setFooter({ text: 'A enquete está ativa e aceitando votos' })
      .setTimestamp();

    await interaction.reply({
      embeds: [publishEmbed],
      ephemeral: true,
    });

    console.log(`✅ Rascunho publicado como enquete: ${draft.titulo} | Msg ID: ${msg.id} | Canal: ${targetChannel.name}`);
  } catch (error) {
    console.error('❌ Erro ao publicar rascunho:', error);
    await interaction.reply({
      content: '❌ Erro ao publicar o rascunho. Verifique minhas permissões no canal.',
      ephemeral: true,
    });
  }
}

async function handleDeletar(interaction, client) {
  const draftId = interaction.options.getString('id');

  const draft = client.draftPolls.get(draftId);
  if (!draft) {
    return await interaction.reply({
      content: `❌ **Erro!** Rascunho com ID \`${draftId}\` não encontrado.`,
      ephemeral: true,
    });
  }

  // Verifica se o usuário é o criador ou admin
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (draft.criadorId !== interaction.user.id && !isAdmin) {
    return await interaction.reply({
      content: '❌ **Permissão negada!** Apenas o criador ou administrador podem deletar este rascunho.',
      ephemeral: true,
    });
  }

  // Remove o rascunho
  client.draftPolls.delete(draftId);

  // Salva a alteração
  const saveFunc = () => {
    try {
      const draftsArray = Array.from(client.draftPolls.values());
      fs.writeFileSync('./draft-polls.json', JSON.stringify(draftsArray, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar rascunhos:', error);
    }
  };
  saveFunc();

  // Confirmação
  const deleteEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('✅ Rascunho Deletado')
    .addFields({ name: 'Título', value: draft.titulo }, { name: 'ID', value: `\`${draftId}\`` })
    .setFooter({ text: 'O rascunho foi permanentemente removido' })
    .setTimestamp();

  await interaction.reply({
    embeds: [deleteEmbed],
    ephemeral: true,
  });

  console.log(`✅ Rascunho deletado: ${draft.titulo} | ID: ${draftId}`);
}

async function handleAdicionarOpcao(interaction, client) {
  const draftId = interaction.options.getString('id');
  const novasOpcoesString = interaction.options.getString('opcoes');

  const draft = client.draftPolls.get(draftId);
  if (!draft) {
    return await interaction.reply({
      content: `❌ **Erro!** Rascunho com ID \`${draftId}\` não encontrado.`,
      ephemeral: true,
    });
  }

  // Verifica se o usuário é o criador ou admin
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (draft.criadorId !== interaction.user.id && !isAdmin) {
    return await interaction.reply({
      content: '❌ **Permissão negada!** Apenas o criador ou administrador podem editar este rascunho.',
      ephemeral: true,
    });
  }

  // Processa as novas opções
  const novasOpcoes = novasOpcoesString
    .split(',')
    .map((op) => op.trim())
    .filter((op) => op.length > 0);

  if (novasOpcoes.length === 0) {
    return await interaction.reply({
      content: '❌ **Erro!** Nenhuma opção válida foi fornecida.',
      ephemeral: true,
    });
  }

  // Verifica duplicatas nas opções existentes
  const opcoesExistentes = draft.opcoes.map((op) => op.toLowerCase());
  const duplicatas = novasOpcoes.filter((op) => opcoesExistentes.includes(op.toLowerCase()));

  if (duplicatas.length > 0) {
    return await interaction.reply({
      content: `❌ **Erro!** As seguintes opções já existem no rascunho: ${duplicatas.join(', ')}`,
      ephemeral: true,
    });
  }

  // Adiciona as novas opções
  draft.opcoes.push(...novasOpcoes);

  // Valida o total de opções
  if (draft.opcoes.length > 20) {
    return await interaction.reply({
      content: `❌ **Erro!** O Discord limita a 20 reações por mensagem. Total de opções: ${draft.opcoes.length}. Remova ${draft.opcoes.length - 20} opção(ões).`,
      ephemeral: true,
    });
  }

  // Valida max_votos
  if (draft.maxVotos > draft.opcoes.length) {
    draft.maxVotos = draft.opcoes.length;
  }

  // Atualiza timestamp de edição
  draft.editadoEm = new Date().toISOString();

  // Salva a alteração
  client.draftPolls.set(draftId, draft);
  const saveFunc = () => {
    try {
      const draftsArray = Array.from(client.draftPolls.values());
      fs.writeFileSync('./draft-polls.json', JSON.stringify(draftsArray, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar rascunho:', error);
    }
  };
  saveFunc();

  // Cria o embed de confirmação
  const updateEmbed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('✅ Opções Adicionadas!')
    .addFields({ name: 'ID', value: `\`${draftId}\`` }, { name: 'Título', value: draft.titulo }, { name: 'Opções Adicionadas', value: novasOpcoes.join(', ') }, { name: 'Total de Opções', value: `${draft.opcoes.length}` }, { name: 'Todas as Opções', value: draft.opcoes.join(', ') })
    .setFooter({ text: 'Status: 📝 Rascunho' })
    .setTimestamp();

  await interaction.reply({
    embeds: [updateEmbed],
    ephemeral: true,
  });

  console.log(`✅ Opções adicionadas ao rascunho: ${draft.titulo} | ID: ${draftId} | Novas: ${novasOpcoes.join(', ')}`);
}

async function handleRemoverOpcao(interaction, client) {
  const draftId = interaction.options.getString('id');
  const opcaoParaRemover = interaction.options.getString('opcao').trim();

  const draft = client.draftPolls.get(draftId);
  if (!draft) {
    return await interaction.reply({
      content: `❌ **Erro!** Rascunho com ID \`${draftId}\` não encontrado.`,
      ephemeral: true,
    });
  }

  // Verifica se o usuário é o criador ou admin
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (draft.criadorId !== interaction.user.id && !isAdmin) {
    return await interaction.reply({
      content: '❌ **Permissão negada!** Apenas o criador ou administrador podem editar este rascunho.',
      ephemeral: true,
    });
  }

  // Tenta encontrar a opção por número ou texto
  let indexRemover = -1;
  let opcaoRemovida = '';

  // Tenta interpretar como número (1-based)
  const numero = parseInt(opcaoParaRemover);
  if (!isNaN(numero) && numero >= 1 && numero <= draft.opcoes.length) {
    indexRemover = numero - 1;
    opcaoRemovida = draft.opcoes[indexRemover];
  } else {
    // Procura por texto exato (case-insensitive)
    indexRemover = draft.opcoes.findIndex((op) => op.toLowerCase() === opcaoParaRemover.toLowerCase());
    if (indexRemover !== -1) {
      opcaoRemovida = draft.opcoes[indexRemover];
    }
  }

  if (indexRemover === -1) {
    return await interaction.reply({
      content: `❌ **Erro!** Opção "${opcaoParaRemover}" não encontrada.\n\n**Opções disponíveis:**\n${draft.opcoes.map((op, i) => `${i + 1}. ${op}`).join('\n')}`,
      ephemeral: true,
    });
  }

  // Remove a opção
  draft.opcoes.splice(indexRemover, 1);

  // Valida número mínimo de opções
  if (draft.opcoes.length < 2) {
    return await interaction.reply({
      content: '❌ **Erro!** A enquete precisa ter pelo menos 2 opções. Não é possível remover mais opções.',
      ephemeral: true,
    });
  }

  // Valida max_votos
  if (draft.maxVotos > draft.opcoes.length) {
    draft.maxVotos = draft.opcoes.length;
  }

  // Atualiza timestamp de edição
  draft.editadoEm = new Date().toISOString();

  // Salva a alteração
  client.draftPolls.set(draftId, draft);
  const saveFunc = () => {
    try {
      const draftsArray = Array.from(client.draftPolls.values());
      fs.writeFileSync('./draft-polls.json', JSON.stringify(draftsArray, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar rascunho:', error);
    }
  };
  saveFunc();

  // Cria o embed de confirmação
  const updateEmbed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('✅ Opção Removida!')
    .addFields({ name: 'ID', value: `\`${draftId}\`` }, { name: 'Título', value: draft.titulo }, { name: 'Opção Removida', value: opcaoRemovida }, { name: 'Total de Opções', value: `${draft.opcoes.length}` }, { name: 'Opções Restantes', value: draft.opcoes.join(', ') })
    .setFooter({ text: 'Status: 📝 Rascunho' })
    .setTimestamp();

  await interaction.reply({
    embeds: [updateEmbed],
    ephemeral: true,
  });

  console.log(`✅ Opção removida do rascunho: ${draft.titulo} | ID: ${draftId} | Removida: ${opcaoRemovida}`);
}
