// Carrega arquivo .env correto baseado em APP_ENV
const envFile = process.env.APP_ENV === 'staging' ? '.env.staging' : '.env';
require('dotenv').config({ path: envFile });

const { Client, GatewayIntentBits, Collection, ChannelType, ActivityType, REST, Routes, Partials, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('../utils/config');
const { loadJsonFile, saveJsonFile, loadMensalistas, ensureDataFiles } = require('../utils/file-handler');
const { ensureMensalistaRoleBinding } = require('../utils/mensalista-binding');

// Exibe configuração na inicialização
config.logConfig();

// Controle de verbosidade de logs (DEBUG=true para logs detalhados)
const DEBUG_MODE = config.DEBUG_MODE;

// =====================================
// CONFIGURAÇÃO DO CLIENTE DISCORD
// =====================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Para interagir com servidores
    GatewayIntentBits.GuildMembers, // Para validar cargos de membros (mensalistas)
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
    saveJsonFile(config.DATA_FILES.activePolls, pollsArray);
  } catch (error) {
    console.error('Erro ao salvar votações ativas:', error);
  }
}

// Salva rascunhos de enquetes em arquivo
function saveDraftPolls() {
  try {
    const draftsArray = Array.from(client.draftPolls.values());
    saveJsonFile(config.DATA_FILES.draftPolls, draftsArray);
  } catch (error) {
    console.error('Erro ao salvar rascunhos:', error);
  }
}

function normalizePollMaxVotos(poll) {
  const maxVotos = Number(poll.maxVotos);
  const maxVotosValido = Number.isFinite(maxVotos) && maxVotos > 0 ? maxVotos : 1;
  const changed = poll.maxVotos !== maxVotosValido;

  if (changed) {
    poll.maxVotos = maxVotosValido;
  }

  return { maxVotosValido, changed };
}

async function hydrateReactionPayload(reaction) {
  if (reaction.partial) {
    await reaction.fetch().catch(() => null);
  }
  if (reaction.message && reaction.message.partial) {
    await reaction.message.fetch().catch(() => null);
  }
}

async function replyInteractionExecutionError(interaction) {
  try {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Erro ao executar o comando!',
        flags: MessageFlags.Ephemeral,
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: 'Erro ao executar o comando!',
      });
    }
  } catch (replyError) {
    console.error('Não foi possível responder à interação:', replyError.message);
  }
}

async function executeInteractionCommand(interaction, commandTypeLabel, notFoundLabel) {
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`${notFoundLabel}: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Erro ao executar o comando${commandTypeLabel}:`, error);
    await replyInteractionExecutionError(interaction);
  }
}

// Exporta funções de persistência via client para uso nos comandos
client.saveActivePolls = saveActivePolls;
client.saveDraftPolls = saveDraftPolls;

function getMensalistasSet() {
  const mensalistasData = loadMensalistas();
  return new Set(mensalistasData.mensalistas || []);
}

async function isUserMensalista(guild, userId, mensalistasSet = null) {
  const isMensalistaManual = (mensalistasSet || getMensalistasSet()).has(userId);

  if (!guild) {
    return isMensalistaManual;
  }

  const roleId = await ensureMensalistaRoleBinding(guild);
  if (!roleId) {
    return isMensalistaManual;
  }

  const member = guild.members.cache.get(userId) || (await guild.members.fetch({ user: userId, force: true }).catch(() => null));
  const isMensalistaByRole = Boolean(member?.roles?.cache?.has(roleId));

  return isMensalistaManual || isMensalistaByRole;
}

async function bindMensalistasRolesOnStartup() {
  let vinculados = 0;

  for (const guild of client.guilds.cache.values()) {
    await guild.roles.fetch().catch(() => null);
    const roleId = await ensureMensalistaRoleBinding(guild);
    if (roleId) vinculados++;
  }

  if (vinculados > 0) {
    console.log(`- Binding automático de mensalista ativo em ${vinculados} servidor(es)`);
  } else {
    console.log('Cargo "Mensalistas" não encontrado. Mantendo comportamento padrão de mensalistas internos.');
  }
}

// Carrega votações ativas do arquivo
function loadActivePolls() {
  try {
    if (fs.existsSync(config.DATA_FILES.activePolls)) {
      const pollsArray = loadJsonFile(config.DATA_FILES.activePolls, []);

      // Normaliza os dados para garantir compatibilidade com enquetes antigas
      const normalizedPolls = pollsArray.map(([id, poll]) => {
        return [
          id,
          {
            ...poll,
            channelId: poll.channelId || null,
            maxVotos: poll.maxVotos || 1,
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
    console.error('Erro ao carregar votações ativas:', error);
  }
}

// Inicializa arquivos essenciais usando file-handler
function initDataFiles() {
  ensureDataFiles();
}

// Carrega rascunhos de enquetes do arquivo
function loadDraftPolls() {
  try {
    if (fs.existsSync(config.DATA_FILES.draftPolls)) {
      const draftsArray = loadJsonFile(config.DATA_FILES.draftPolls, []);

      // Limpeza automática: remove rascunhos com mais de 60 dias
      const agora = Date.now();
      const LIMITE_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias em ms
      let removidos = 0;

      const draftsFiltrados = draftsArray.filter((draft) => {
        const dataRef = draft.editadoEm || draft.criadoEm;
        if (!dataRef) return true;
        const diff = agora - new Date(dataRef).getTime();
        if (diff > LIMITE_MS) {
          removidos++;
          return false;
        }
        return true;
      });

      // Normaliza os dados
      const normalizedDrafts = draftsFiltrados.map((draft) => {
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
      if (removidos > 0) {
        // Salva imediatamente se houve remoção
        const draftsToSave = Array.from(client.draftPolls.values());
        saveJsonFile(config.DATA_FILES.draftPolls, draftsToSave);
        console.log(`Limpeza automática: ${removidos} rascunho(s) antigo(s) removido(s) (90+ dias)`);
        console.info(`[INFO] Foram removidos ${removidos} rascunho(s) antigo(s) de enquete (90+ dias) durante a inicialização.`);
      }
      console.log(`${normalizedDrafts.length} rascunho(s) de enquete(s) carregado(s)`);
    }
  } catch (error) {
    console.error('Erro ao carregar rascunhos:', error);
  }
}

// Inicializa arquivos de dados e armazena logs
let logBoot = [];
const originalConsoleLog = console.log;
console.log = function (...args) {
  logBoot.push(args.join(' '));
};
initDataFiles();
loadActivePolls();
loadDraftPolls();
console.log = originalConsoleLog;

// Sincroniza reações das enquetes ativas após o bot iniciar
async function syncPollReactions() {
  const totalEnquetes = client.activePolls.size;

  // Carrega mensalistas manuais uma vez antes do loop (otimização)
  const mensalistasSet = getMensalistasSet();
  const enquetesOrfas = [];
  let enquetesProcessadas = 0;
  const startTime = Date.now();

  for (const [messageId, poll] of client.activePolls.entries()) {
    try {
      enquetesProcessadas++;

      // Se não tiver channelId, pula (enquetes antigas antes da atualização)
      if (!poll.channelId) {
        console.log(`[${enquetesProcessadas}/${totalEnquetes}] "${poll.titulo}" sem channelId - pulando`);
        continue;
      }

      console.log(`Sincronizando "${poll.titulo}"... [${enquetesProcessadas}/${totalEnquetes}]`);

      // Busca o canal
      const channel = await client.channels.fetch(poll.channelId).catch((err) => {
        console.log(`Erro ao buscar canal: ${err.message}`);
        return null;
      });
      if (!channel) {
        console.log(`Canal não encontrado - marcando para remoção`);
        enquetesOrfas.push(messageId);
        continue;
      }

      const guild = channel.guild;

      // Verifica permissões do bot no canal
      const botMember = channel.guild?.members.me;
      if (botMember) {
        const permissions = channel.permissionsFor(botMember);
        const canRead = permissions?.has('ReadMessageHistory');

        if (!canRead) {
          console.log(`Falta permissão "Ler Histórico" em ${channel.name}`);
        }
      }

      // Tenta buscar a mensagem
      const message = await channel.messages.fetch(messageId).catch((err) => {
        console.log(`Mensagem não encontrada: ${err.message}`);
        return null;
      });
      if (!message) {
        enquetesOrfas.push(messageId);
        continue;
      }

      // Fetch todas as reações para garantir cache completo (paralelizado)
      // Isso é crucial para detectar votos feitos enquanto o bot estava offline
      const reactionFetches = [];
      for (const reaction of message.reactions.cache.values()) {
        if (reaction.partial) {
          reactionFetches.push(reaction.fetch().catch(() => null));
        }
      }
      await Promise.all(reactionFetches);

      // Fetch de usuários para cada reação (paralelizado)
      // Cache dos usuários por reação para evitar fetch duplicado
      const userFetches = [];
      const reactionUsersMap = new Map();

      for (const reaction of message.reactions.cache.values()) {
        const fetchPromise = reaction.users
          .fetch()
          .then((users) => {
            reactionUsersMap.set(reaction.emoji.name, users);
            return users;
          })
          .catch(() => null);
        userFetches.push(fetchPromise);
      }
      await Promise.all(userFetches);

      const votosAtualizados = {};

      // Para cada reação na mensagem (usando dados já cacheados)
      for (const reaction of message.reactions.cache.values()) {
        const emoji = reaction.emoji.name;

        // Só processa emojis válidos da enquete
        if (!poll.emojiNumeros.includes(emoji)) continue;

        // Usa os usuários já cacheados (sem fetch adicional)
        const users = reactionUsersMap.get(emoji);
        if (!users) continue;

        for (const user of users.values()) {
          if (user.bot) continue; // Ignora bot

          // Inicializa votos do usuário se não existir
          if (!votosAtualizados[user.id]) {
            const isMensalista = await isUserMensalista(guild, user.id, mensalistasSet);
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

      const totalVotos = Object.keys(votosAtualizados).length;
      console.log(`  — ${totalVotos} voto(s) sincronizado(s)`);
    } catch (error) {
      console.error(`Erro ao sincronizar enquete "${poll.titulo}":`, error.message);
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

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const enquetesAtivas = client.activePolls.size;

  if (enquetesAtivas > 0) {
    console.log(`\n— ${enquetesAtivas} enquete(s) sincronizada(s) em ${elapsed}s\n`);
  } else {
    console.log(`\n— Sincronização concluída em ${elapsed}s (nenhuma enquete ativa)\n`);
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
      normalizePollMaxVotos(poll);

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
                    console.error('Sem permissão para remover reação de ' + userVotes.usuario + '. O bot precisa de "Gerenciar Mensagens"');
                  } else {
                    console.error(`Erro ao remover reação: ${err.message}`);
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
            console.error('Erro ao remover votos de ' + userVotes.usuario + ':', error.message);
          }
        }
      }

      if (violacoesSencontradas > 0) {
        console.log(`"${poll.titulo}": ${violacoesSencontradas} usuário(s) tiveram votos ajustados`);
      }
    } catch (error) {
      console.error('Erro ao verificar limites de "' + poll.titulo + '":', error.message);
    }
  }

  // Remove enquetes órfãs (se ainda não foram removidas na sincronização)
  if (enquetesOrfas.length > 0) {
    console.log(`Removendo ${enquetesOrfas.length} enquete(s) órfã(s)...`);
    for (const messageId of enquetesOrfas) {
      client.activePolls.delete(messageId);
    }
  }

  // Salva após aplicar limites
  saveActivePolls();
  if (client.activePolls.size > 0) {
    console.log('Verificação de limites concluída');
  }
}

// =====================================
// CARREGAMENTO DE COMANDOS
// =====================================
// Carrega comandos recursivamente de todos os domínios (polls, users, admin)
function loadCommandsRecursively(dir) {
  const commands = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursivamente carrega subdirectórios
      commands.push(...loadCommandsRecursively(filePath));
    } else if (file.endsWith('.js')) {
      // Carrega arquivo de comando
      try {
        const command = require(filePath);
        if (command.data && command.execute) {
          commands.push({ file, command, path: filePath });
        }
      } catch (error) {
        console.error(`Erro ao carregar comando ${file}:`, error);
      }
    }
  }

  return commands;
}

const commandsPath = path.join(__dirname, '../commands');
const loadedCommands = loadCommandsRecursively(commandsPath);

for (const { command } of loadedCommands) {
  client.commands.set(command.data.name, command);
}

console.log(`${client.commands.size} comando(s) carregado(s)`);

// =====================================
// DEPLOY DE COMANDOS
// =====================================
async function deployCommands() {
  try {
    const commands = [];
    let slashCount = 0;
    let contextCount = 0;

    // Carrega todos os comandos para registrar
    for (const { command } of loadedCommands) {
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
    const rest = new REST({ version: '10' }).setToken(config.TOKEN);

    // Verifica se CLIENT_ID está definido
    const clientId = config.CLIENT_ID;

    if (!clientId) {
      console.error('   ERRO: CLIENT_ID não está definido no arquivo .env');
      console.error('   Adicione: CLIENT_ID=seu_client_id_aqui');
      return false;
    }

    // Registra os comandos globalmente (disponível em todos os servidores)
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    return true;
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
    return false;
  }
}

// =====================================
// EVENTOS
// =====================================

// Evento: Bot conectado e pronto
client.once('clientReady', async () => {
  console.log(`${client.user.tag} está ONLINE\n`);
  client.user.setActivity('📚 Clube do Livro', { type: ActivityType.Watching });

  await bindMensalistasRolesOnStartup();

  // Deploy de comandos se requisitado via variável de ambiente ou flag
  if (config.DEPLOY) {
    console.log('Registrando comandos...');
    const deploySuccess = await deployCommands();
    if (deploySuccess) {
      console.log('Deploy concluído com sucesso\n');
      // Se foi deployment via linha de comando, sai após sucesso
      if (process.argv.includes('--deploy')) {
        process.exit(0);
      }
    } else {
      console.error('Deploy falhou\n');
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
    await executeInteractionCommand(interaction, '', 'Comando não encontrado');
  }

  // Processa comandos de contexto (clique direito)
  if (interaction.isContextMenuCommand()) {
    await executeInteractionCommand(interaction, ' de contexto', 'Comando de contexto não encontrado');
  }
});

// Evento: Reação adicionada
client.on('messageReactionAdd', async (reaction, user) => {
  try {
    // Ignora reações do próprio bot
    if (user.bot) return;

    // Garante acesso a dados completos em mensagens/reacoes nao cacheadas
    await hydrateReactionPayload(reaction);

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

    const isMensalista = await isUserMensalista(reaction.message.guild, user.id);
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

    // Mantém o peso atualizado caso o status de mensalista tenha mudado
    poll.votos[user.id].peso = peso;

    // Verifica se já votou nesta opção
    if (poll.votos[user.id].reacoes.includes(emoji)) {
      return; // Já votou nesta opção
    }

    // Normaliza maxVotos
    const { maxVotosValido, changed } = normalizePollMaxVotos(poll);
    if (changed) {
      saveActivePolls();
    }

    // Verifica se atingiu o limite de votos
    if (poll.votos[user.id].reacoes.length >= maxVotosValido) {
      // Remove a reação e notifica (se possível)
      await reaction.users.remove(user.id).catch(() => null);
      try {
        await user.send(`Você já atingiu o limite de ${maxVotosValido} voto(s) nesta enquete: "${poll.titulo}"`);
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
      console.error('Erro ao processar reação:', error);
    }
  }
});

// Evento: Reação removida
client.on('messageReactionRemove', async (reaction, user) => {
  try {
    if (user.bot) return;

    // Garante acesso a dados completos em mensagens/reacoes nao cacheadas
    await hydrateReactionPayload(reaction);

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
      console.error('Erro ao remover reação:', error);
    }
  }
});

// =====================================
// SERVIDOR WEB (MANTER BOT ATIVO)
// =====================================
const app = express();
const port = config.PORT; // O Koyeb injeta a porta automaticamente

app.get('/', (req, res) => res.send(`Bot Online! [${config.APP_ENV.toUpperCase()}]`));

let keepAliveStarted = false;
function startKeepAlive() {
  if (keepAliveStarted) return;
  keepAliveStarted = true;
  app.listen(port, () => {
    // O log será feito após o bot estar online
  });
}

// =====================================
// LOGIN DO BOT
// =====================================
client.login(config.TOKEN);

// Evento: Bot conectado e pronto
client.once('clientReady', async () => {
  // Exibe logs de carregamento
  for (const line of logBoot) {
    originalConsoleLog(line);
  }

  // Binding de mensalistas
  await bindMensalistasRolesOnStartup();

  // Verifica e remove votos que excedem o limite
  await enforceVoteLimits();

  // Sincroniza reações das enquetes ativas
  await syncPollReactions();

  // Inicia o keep-alive e exibe logs finais
  startKeepAlive();
  originalConsoleLog(`Keep-alive rodando na porta ${port}`);
  originalConsoleLog(`${client.user.tag} está ONLINE`);
});
