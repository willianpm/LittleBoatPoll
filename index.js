require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ChannelType, ActivityType, REST, Routes, Partials, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Controle de verbosidade de logs (DEBUG=true para logs detalhados)
const DEBUG_MODE = process.env.DEBUG === 'true';

// =====================================
// CONFIGURAÇÃO DO CLIENTE DISCORD
// =====================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Para interagir com servidores
    GatewayIntentBits.GuildMessages, // Para ler mensagens
    GatewayIntentBits.MessageContent, // Para ler conteúdo das mensagens
    GatewayIntentBits.DirectMessages, // Para DMs
    GatewayIntentBits.GuildMessageReactions, // CRUCIAL: Para ler reações
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Criamos uma coleção para armazenar os comandos slash
client.commands = new Collection();

// Estrutura para armazenar votações ativas em memória
client.activePolls = new Map();

// Estrutura para armazenar rascunhos de enquetes
client.draftPolls = new Map();

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

// Salva votações ativas em arquivo
function saveActivePolls() {
  try {
    const pollsArray = Array.from(client.activePolls.entries());
    fs.writeFileSync('./active-polls.json', JSON.stringify(pollsArray, null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar votações ativas:', error);
  }
}

// Salva rascunhos de enquetes em arquivo
function saveDraftPolls() {
  try {
    const draftsArray = Array.from(client.draftPolls.values());
    fs.writeFileSync('./draft-polls.json', JSON.stringify(draftsArray, null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar rascunhos:', error);
  }
}

// Exporta funções de persistência via client para uso nos comandos
client.saveActivePolls = saveActivePolls;
client.saveDraftPolls = saveDraftPolls;

// Carrega votações ativas do arquivo
function loadActivePolls() {
  try {
    if (fs.existsSync('./active-polls.json')) {
      const pollsArray = JSON.parse(fs.readFileSync('./active-polls.json', 'utf8'));

      // Normaliza os dados para garantir compatibilidade com enquetes antigas
      const normalizedPolls = pollsArray.map(([id, poll]) => {
        return [
          id,
          {
            ...poll,
            channelId: poll.channelId || null, // Garante que channelId existe
            maxVotos: poll.maxVotos || 1, // Garante que maxVotos existe
            usarPesoMensalista: poll.usarPesoMensalista !== undefined ? poll.usarPesoMensalista : false,
            votos: poll.votos || {},
            status: poll.status || 'ativa',
          },
        ];
      });

      client.activePolls = new Map(normalizedPolls);
      console.log(`${normalizedPolls.length} votação(ões) ativa(s) carregada(s)`);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar votações ativas:', error);
  }
}

// Garante que arquivos essenciais existam
function ensureDataFiles() {
  // mensalistas.json
  if (!fs.existsSync('./mensalistas.json')) {
    fs.writeFileSync('./mensalistas.json', JSON.stringify({ mensalistas: [] }, null, 2));
    console.log('Arquivo mensalistas.json criado');
  }

  // historico-votacoes.json
  if (!fs.existsSync('./historico-votacoes.json')) {
    fs.writeFileSync('./historico-votacoes.json', JSON.stringify({ votacoes: [] }, null, 2));
    console.log('Arquivo historico-votacoes.json criado');
  }

  // cargos-criadores.json
  if (!fs.existsSync('./cargos-criadores.json')) {
    fs.writeFileSync('./cargos-criadores.json', JSON.stringify({ cargos: [] }, null, 2));
    console.log('Arquivo cargos-criadores.json criado');
  }

  // draft-polls.json
  if (!fs.existsSync('./draft-polls.json')) {
    fs.writeFileSync('./draft-polls.json', JSON.stringify([], null, 2));
    console.log('Arquivo draft-polls.json criado');
  }
}

// Carrega rascunhos de enquetes do arquivo
function loadDraftPolls() {
  try {
    if (fs.existsSync('./draft-polls.json')) {
      const draftsArray = JSON.parse(fs.readFileSync('./draft-polls.json', 'utf8'));

      // Normaliza os dados
      const normalizedDrafts = draftsArray.map((draft) => {
        return [
          draft.id,
          {
            ...draft,
            maxVotos: draft.maxVotos || 1,
            usarPesoMensalista: draft.usarPesoMensalista !== undefined ? draft.usarPesoMensalista : false,
            criadorId: draft.criadorId || null,
            criadoEm: draft.criadoEm || new Date().toISOString(),
            editadoEm: draft.editadoEm || new Date().toISOString(),
          },
        ];
      });

      client.draftPolls = new Map(normalizedDrafts);
      console.log(`${normalizedDrafts.length} rascunho(s) de enquete(s) carregado(s)`);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar rascunhos:', error);
  }
}

// Inicializa arquivos de dados
ensureDataFiles();
loadActivePolls();
loadDraftPolls();

// Sincroniza reações das enquetes ativas após o bot iniciar
async function syncPollReactions() {
  console.log('Sincronizando reações das enquetes ativas...');

  const enquetesOrfas = [];

  for (const [messageId, poll] of client.activePolls.entries()) {
    try {
      // Se não tiver channelId, pula (enquetes antigas antes da atualização)
      if (!poll.channelId) {
        console.log(`Enquete "${poll.titulo}" sem channelId - pulando`);
        continue;
      }

      // Busca o canal
      const channel = await client.channels.fetch(poll.channelId).catch((err) => {
        console.log(`Erro ao buscar canal ${poll.channelId}: ${err.message}`);
        return null;
      });
      if (!channel) {
        console.log(`Canal não encontrado para enquete "${poll.titulo}" - marcando para remoção`);
        enquetesOrfas.push(messageId);
        continue;
      }

      // Verifica permissões do bot no canal
      const botMember = channel.guild?.members.me;
      if (botMember) {
        const permissions = channel.permissionsFor(botMember);
        const canRead = permissions?.has('ReadMessageHistory');

        if (!canRead) {
          console.log(`"${poll.titulo}" (${channel.name}): Falta permissão "Ler Histórico"`);
        }
      }

      // Tenta buscar a mensagem
      const message = await channel.messages.fetch(messageId).catch((err) => {
        console.log(`"${poll.titulo}": ${err.message} (${err.code})`);
        return null;
      });
      if (!message) {
        enquetesOrfas.push(messageId);
        continue;
      }

      // Fetch todas as reações para garantir cache completo
      // Isso é crucial para detectar votos feitos enquanto o bot estava offline
      for (const reaction of message.reactions.cache.values()) {
        if (reaction.partial) {
          await reaction.fetch().catch(() => null);
        }
        // Força fetch de todos os usuários para cada reação
        await reaction.users.fetch().catch(() => null);
      }

      // Carrega mensalistas
      let mensalistasData = { mensalistas: [] };
      if (fs.existsSync('./mensalistas.json')) {
        mensalistasData = JSON.parse(fs.readFileSync('./mensalistas.json', 'utf8'));
      }

      // Reseta os votos para reconstruir baseado nas reações reais
      const votosAtualizados = {};

      // Para cada reação na mensagem
      for (const reaction of message.reactions.cache.values()) {
        const emoji = reaction.emoji.name;

        // Só processa emojis válidos da enquete
        if (!poll.emojiNumeros.includes(emoji)) continue;

        // Busca todos os usuários que reagiram
        const users = await reaction.users.fetch();

        for (const user of users.values()) {
          if (user.bot) continue; // Ignora bot

          // Inicializa votos do usuário se não existir
          if (!votosAtualizados[user.id]) {
            const isMensalista = mensalistasData.mensalistas.includes(user.id);
            const peso = isMensalista && poll.usarPesoMensalista ? 2 : 1;

            votosAtualizados[user.id] = {
              usuario: user.username,
              peso: peso,
              reacoes: [],
              timestamp: poll.votos[user.id]?.timestamp || new Date(),
            };
          }

          // Adiciona a reação se não estiver duplicada
          if (!votosAtualizados[user.id].reacoes.includes(emoji)) {
            votosAtualizados[user.id].reacoes.push(emoji);
          }
        }
      }

      // Atualiza os votos da enquete
      poll.votos = votosAtualizados;

      // Sincronização silenciosa - sucesso
    } catch (error) {
      console.error(`❌ Erro ao sincronizar enquete "${poll.titulo}":`, error.message);
    }
  }

  // Remove enquetes órfãs (mensagens deletadas)
  if (enquetesOrfas.length > 0) {
    console.log(`\nRemovendo ${enquetesOrfas.length} enquete(s) órfã(s)...`);
    for (const messageId of enquetesOrfas) {
      client.activePolls.delete(messageId);
    }
  }

  // Salva após sincronizar
  saveActivePolls();

  const totalEnquetes = client.activePolls.size;
  if (totalEnquetes > 0) {
    console.log(`${totalEnquetes} enquete(s) sincronizada(s)\n`);
  } else {
    console.log('Sincronização concluída\n');
  }
}

// Verifica e remove votos que excedem o limite configurado
async function enforceVoteLimits() {
  const enquetesOrfas = [];

  for (const [messageId, poll] of client.activePolls.entries()) {
    try {
      // Se não tiver channelId, pula
      if (!poll.channelId) continue;

      const channel = await client.channels.fetch(poll.channelId).catch((err) => {
        console.log(`Erro ao buscar canal ${poll.channelId}: ${err.message}`);
        return null;
      });
      if (!channel) {
        enquetesOrfas.push(messageId);
        continue;
      }

      // Verifica permissões do bot no canal
      const botMember = channel.guild?.members.me;
      if (botMember) {
        const permissions = channel.permissionsFor(botMember);
        const canView = permissions?.has('ViewChannel');
        const canRead = permissions?.has('ReadMessageHistory');
        const canManage = permissions?.has('ManageMessages');

        if (!canView || !canRead || !canManage) {
          console.log(`Enquete "${poll.titulo}" no canal "${channel.name}" - Permissões:\n` + `   Ver Canal: ${canView ? 'Sim' : 'NÃO'}\n` + `   Ler Histórico: ${canRead ? 'Sim' : 'NÃO'}\n` + `   Gerenciar Mensagens: ${canManage ? 'Sim' : 'NÃO'}`);
        }
      }

      const message = await channel.messages.fetch(messageId).catch((err) => {
        console.log(`Erro ao buscar mensagem ${messageId} no canal ${channel.name}: ${err.message} (${err.code})`);
        return null;
      });
      if (!message) {
        enquetesOrfas.push(messageId);
        continue;
      }

      // Fetch todas as reações para garantir cache completo
      // Sem isso, reações adicionadas enquanto bot estava offline não são detectadas
      for (const reaction of message.reactions.cache.values()) {
        if (reaction.partial) {
          await reaction.fetch().catch(() => null);
        }
        await reaction.users.fetch().catch(() => null);
      }

      // Normaliza maxVotos para garantir que seja um número válido
      const maxVotos = Number(poll.maxVotos);
      const maxVotosValido = Number.isFinite(maxVotos) && maxVotos > 0 ? maxVotos : 1;
      if (poll.maxVotos !== maxVotosValido) {
        poll.maxVotos = maxVotosValido;
      }

      let violacoesSencontradas = 0;

      // Para cada usuário que votou
      for (const [userId, userVotes] of Object.entries(poll.votos)) {
        const numVotos = userVotes.reacoes.length;

        // Se excedeu o limite
        if (numVotos > poll.maxVotos) {
          console.log(`"${poll.titulo}" - ${userVotes.usuario}: ${numVotos} votos (limite: ${poll.maxVotos})`);

          // Determina quantos votos remover (remove os últimos adicionados)
          const votosParaRemover = numVotos - poll.maxVotos;
          const reacoesParaRemover = userVotes.reacoes.slice(-votosParaRemover);

          try {
            // Remove as reações em excesso da mensagem
            for (const emoji of reacoesParaRemover) {
              const reaction = message.reactions.cache.find((r) => r.emoji.name === emoji);
              if (reaction) {
                await reaction.users.remove(userId).catch((err) => {
                  if (err.code === 50013) {
                    console.error('❌ Sem permissão para remover reação de ' + userVotes.usuario + '. O bot precisa de "Gerenciar Mensagens"');
                  } else {
                    console.error(`❌ Erro ao remover reação: ${err.message}`);
                  }
                });
              }
            }

            // Atualiza votos em memória, mantendo apenas os primeiros
            userVotes.reacoes = userVotes.reacoes.slice(0, poll.maxVotos);

            // Tenta notificar o usuário
            try {
              const user = await client.users.fetch(userId).catch(() => null);
              if (user) {
                await user.send(`⚠️ **Votos ajustados em "${poll.titulo}"**\n\n` + `Você havia votado em ${numVotos} opção(ões), mas o limite é ${poll.maxVotos}.\n` + `As ${votosParaRemover} opção(ões) mais recente(s) foram removidas.\n` + `Seus votos atuais: ${userVotes.reacoes.join(', ')}`).catch(() => {});
              }
            } catch (e) {
              // Silencioso se não conseguir enviar DM
            }

            violacoesSencontradas++;
            console.log(`Removidos ${votosParaRemover} voto(s) em excesso de ${userVotes.usuario}`);
          } catch (error) {
            console.error('❌ Erro ao remover votos de ' + userVotes.usuario + ':', error.message);
          }
        }
      }

      if (violacoesSencontradas > 0) {
        console.log(`"${poll.titulo}": ${violacoesSencontradas} usuário(s) tiveram votos ajustados`);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar limites de "' + poll.titulo + '":', error.message);
    }
  }

  // Remove enquetes órfãs (se ainda não foram removidas na sincronização)
  if (enquetesOrfas.length > 0) {
    console.log(`\nRemovendo ${enquetesOrfas.length} enquete(s) órfã(s)...`);
    for (const messageId of enquetesOrfas) {
      client.activePolls.delete(messageId);
    }
  }

  // Salva após aplicar limites
  saveActivePolls();
  if (client.activePolls.size > 0) {
    console.log('Verificação de limites concluída\n');
  }
}

// =====================================
// CARREGAMENTO DE COMANDOS
// =====================================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    // Comando carregado silenciosamente
  }
}

console.log(`${client.commands.size} comando(s) carregado(s)\n`);

// =====================================
// DEPLOY DE COMANDOS
// =====================================
async function deployCommands() {
  try {
    const commands = [];
    let slashCount = 0;
    let contextCount = 0;

    // Carrega todos os comandos para registrar
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      if (command.data && command.execute) {
        commands.push(command.data.toJSON());

        // Identifica o tipo de comando
        if (command.data.type === 3) {
          // ApplicationCommandType.Message = 3
          contextCount++;
        } else {
          slashCount++;
        }
      }
    }

    // Cria a instância REST para comunicar com a API do Discord
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    // Verifica se CLIENT_ID está definido
    const clientId = process.env.CLIENT_ID;

    if (!clientId) {
      console.error('❌ ERRO: CLIENT_ID não está definido no arquivo .env');
      console.error('   Adicione: CLIENT_ID=seu_client_id_aqui');
      return false;
    }

    // Registra os comandos globalmente (disponível em todos os servidores)
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    return true;
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
    return false;
  }
}

// =====================================
// CARREGAMENTO DE COMANDOS
// =====================================

// =====================================
// EVENTOS
// =====================================

// Evento: Bot conectado e pronto
client.once('clientReady', async () => {
  console.log(`${client.user.tag} está ONLINE\n`);
  client.user.setActivity('📚 Clube do Livro', { type: ActivityType.Watching });

  // Deploy de comandos se requisitado via variável de ambiente ou flag
  if (process.env.DEPLOY === 'true' || process.argv.includes('--deploy')) {
    console.log('Registrando comandos...');
    const deploySuccess = await deployCommands();
    if (deploySuccess) {
      console.log('Deploy concluído com sucesso\n');
      // Se foi deployment via linha de comando, sai após sucesso
      if (process.argv.includes('--deploy')) {
        process.exit(0);
      }
    } else {
      console.error('❌ Deploy falhou\n');
      if (process.argv.includes('--deploy')) {
        process.exit(1);
      }
    }
  }

  // Sincroniza reações das enquetes ativas
  await syncPollReactions();

  // Verifica e remove votos que excedem o limite
  await enforceVoteLimits();
});

// Evento: Interação criada (Slash Commands, Context Menu, Buttons, etc)
client.on('interactionCreate', async (interaction) => {
  // Processa comandos slash
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error('❌ Comando não encontrado: ' + interaction.commandName);
      return;
    }

    try {
      // Comando executado
      await command.execute(interaction, client);
    } catch (error) {
      console.error('❌ Erro ao executar o comando:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao executar o comando!',
          ephemeral: true,
        });
      }
    }
  }

  // Processa comandos de contexto (clique direito)
  if (interaction.isContextMenuCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error('❌ Comando de contexto não encontrado: ' + interaction.commandName);
      return;
    }

    try {
      // Comando de contexto executado
      await command.execute(interaction, client);
    } catch (error) {
      console.error('❌ Erro ao executar o comando de contexto:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao executar o comando!',
          ephemeral: true,
        });
      }
    }
  }
});

// Evento: Reação adicionada
client.on('messageReactionAdd', async (reaction, user) => {
  try {
    // Ignora reações do próprio bot
    if (user.bot) return;

    // Garante acesso a dados completos em mensagens/reacoes nao cacheadas
    if (reaction.partial) {
      await reaction.fetch().catch(() => null);
    }
    if (reaction.message && reaction.message.partial) {
      await reaction.message.fetch().catch(() => null);
    }

    // Busca a votação ativa para esta mensagem
    const poll = client.activePolls.get(reaction.message.id);
    if (!poll) return;

    const emoji = reaction.emoji.name;

    // Verifica se o emoji é válido para esta enquete
    if (!poll.emojiNumeros.includes(emoji)) {
      // Emoji não faz parte desta enquete, remove
      await reaction.users.remove(user.id).catch(() => null);
      return;
    }

    // Recarrega os dados de mensalistas
    let mensalistasData = { mensalistas: [] };
    if (fs.existsSync('./mensalistas.json')) {
      mensalistasData = JSON.parse(fs.readFileSync('./mensalistas.json', 'utf8'));
    }
    const isMensalista = mensalistasData.mensalistas.includes(user.id);
    // Calcula o peso baseado na configuração da enquete
    const peso = isMensalista && poll.usarPesoMensalista ? 2 : 1;

    // Inicializa votos do usuário se não existir
    if (!poll.votos[user.id]) {
      poll.votos[user.id] = {
        usuario: user.username,
        peso: peso,
        reacoes: [],
        timestamp: new Date(),
      };
    }

    // Verifica se já votou nesta opção
    if (poll.votos[user.id].reacoes.includes(emoji)) {
      return; // Já votou nesta opção
    }

    // Normaliza maxVotos
    const maxVotos = Number(poll.maxVotos);
    const maxVotosValido = Number.isFinite(maxVotos) && maxVotos > 0 ? maxVotos : 1;
    if (poll.maxVotos !== maxVotosValido) {
      poll.maxVotos = maxVotosValido;
      saveActivePolls();
    }

    // Verifica se atingiu o limite de votos
    if (poll.votos[user.id].reacoes.length >= poll.maxVotos) {
      // Remove a reação e notifica (se possível)
      await reaction.users.remove(user.id).catch(() => null);
      try {
        await user.send(`❌ Você já atingiu o limite de **${poll.maxVotos}** voto(s) nesta enquete: "${poll.titulo}"`);
      } catch (e) {
        // DM bloqueada ou desativada
      }
      return;
    }

    // Adiciona a reação
    poll.votos[user.id].reacoes.push(emoji);

    // Salva as votações após cada mudança
    saveActivePolls();
  } catch (error) {
    if (DEBUG_MODE) {
      console.error('❌ Erro ao processar reação:', error);
    }
  }
});

// Evento: Reação removida
client.on('messageReactionRemove', async (reaction, user) => {
  try {
    if (user.bot) return;

    // Garante acesso a dados completos em mensagens/reacoes nao cacheadas
    if (reaction.partial) {
      await reaction.fetch().catch(() => null);
    }
    if (reaction.message && reaction.message.partial) {
      await reaction.message.fetch().catch(() => null);
    }

    const poll = client.activePolls.get(reaction.message.id);
    if (!poll) return;

    const emoji = reaction.emoji.name;

    // Remove apenas esta reação específica
    if (poll.votos[user.id] && poll.votos[user.id].reacoes) {
      const index = poll.votos[user.id].reacoes.indexOf(emoji);
      if (index > -1) {
        poll.votos[user.id].reacoes.splice(index, 1);

        // Se não tem mais reações, remove o usuário completamente
        if (poll.votos[user.id].reacoes.length === 0) {
          delete poll.votos[user.id];
        }
      }
    }

    // Salva as votações após cada mudança
    saveActivePolls();
  } catch (error) {
    if (DEBUG_MODE) {
      console.error('❌ Erro ao remover reação:', error);
    }
  }
});

// =====================================
// SERVIDOR WEB (MANTER BOT ATIVO)
// =====================================
const app = express();
const port = process.env.PORT || 8000; // O Koyeb injeta a porta automaticamente

app.get('/', (req, res) => res.send('Bot Online!'));

app.listen(port, () => {
  console.log(`Keep-alive rodando na porta ${port}`);
});

// =====================================
// LOGIN DO BOT
// =====================================
client.login(process.env.TOKEN);
