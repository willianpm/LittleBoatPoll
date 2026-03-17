// Carrega arquivo .env correto baseado em APP_ENV
const envFile = process.env.APP_ENV === 'staging' ? '.env.staging' : '.env';
require('dotenv').config({ path: envFile });

const { ActivityType, REST, Routes, MessageFlags } = require('discord.js');
const { client } = require('./client');
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { loadJsonFile, saveJsonFile, loadMensalistas, ensureDataFiles } = require('../utils/file-handler');
const { ensureMensalistaRoleBinding } = require('../utils/mensalista-binding');

// Exibe configuração na inicialização
config.logConfig();

// Controle de verbosidade de logs (DEBUG=true para logs detalhados)
const DEBUG_MODE = config.DEBUG_MODE;

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

// Salva votações ativas em arquivo
function saveActivePolls() {
  try {
    const pollsArray = Array.from(client.activePolls.entries());
    saveJsonFile(config.DATA_FILES.activePolls, pollsArray);
  } catch (error) {
    logger.error(`Erro ao salvar votações ativas: ${error.message}`);
  }
}

// Salva rascunhos de enquetes em arquivo
function saveDraftPolls() {
  try {
    const draftsArray = Array.from(client.draftPolls.values());
    saveJsonFile(config.DATA_FILES.draftPolls, draftsArray);
  } catch (error) {
    logger.error(`Erro ao salvar rascunhos: ${error.message}`);
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
    logger.error(`Não foi possível responder à interação: ${replyError.message}`);
  }
}

async function executeInteractionCommand(interaction, commandTypeLabel, notFoundLabel) {
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`${notFoundLabel}: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    logger.error(`Erro ao executar o comando${commandTypeLabel}: ${error.message}`);
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

  const member =
    guild.members.cache.get(userId) || (await guild.members.fetch({ user: userId, force: true }).catch(() => null));
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
    logger.info(`Binding automático de mensalista ativo em ${vinculados} servidor(es)`);
  } else {
    logger.info('Cargo "Mensalistas" não encontrado. Mantendo comportamento padrão de mensalistas internos.');
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
      logger.info(`${normalizedPolls.length} votação(ões) ativa(s) carregada(s)`);
    }
  } catch (error) {
    logger.error(`Erro ao carregar votações ativas: ${error.message}`);
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

      // Limpeza automática: remove rascunhos com mais de 90 dias
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
        logger.info(`Limpeza automática: ${removidos} rascunho(s) antigo(s) removido(s) (90+ dias)`);
      }
      logger.info(`${normalizedDrafts.length} rascunho(s) de enquete(s) carregado(s)`);
    }
  } catch (error) {
    logger.error(`Erro ao carregar rascunhos: ${error.message}`);
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
        logger.info(`[${enquetesProcessadas}/${totalEnquetes}] "${poll.titulo}" sem channelId - pulando`);
        continue;
      }

      logger.info(`Sincronizando "${poll.titulo}"... [${enquetesProcessadas}/${totalEnquetes}]`);

      // Busca o canal
      const channel = await client.channels.fetch(poll.channelId).catch((err) => {
        logger.error(`Erro ao buscar canal: ${err.message}`);
        return null;
      });
      if (!channel) {
        logger.warn('Canal não encontrado - marcando para remoção');
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
          logger.warn(`Falta permissão "Ler Histórico" em ${channel.name}`);
        }
      }

      // Tenta buscar a mensagem
      const message = await channel.messages.fetch(messageId).catch((err) => {
        logger.error(`Mensagem não encontrada: ${err.message}`);
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
      logger.info(`${totalVotos} voto(s) sincronizado(s)`);
    } catch (error) {
      logger.error(`Erro ao sincronizar enquete "${poll.titulo}": ${error.message}`);
    }
  }

  // Remove enquetes órfãs (mensagens deletadas)
  if (enquetesOrfas.length > 0) {
    logger.info(`Removendo ${enquetesOrfas.length} enquete(s) órfã(s)...`);
    for (const messageId of enquetesOrfas) {
      client.activePolls.delete(messageId);
    }
  }

  // Salva após sincronizar
  saveActivePolls();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const enquetesAtivas = client.activePolls.size;

  if (enquetesAtivas > 0) {
    logger.info(`${enquetesAtivas} enquete(s) sincronizada(s) em ${elapsed}s`);
  } else {
    logger.info(`Sincronização concluída em ${elapsed}s (nenhuma enquete ativa)`);
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
        logger.error(`Erro ao buscar canal ${poll.channelId}: ${err.message}`);
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
          logger.warn(
            `Enquete "${poll.titulo}" no canal "${channel.name}" - Permissões: ` +
              `Ver Canal: ${canView ? 'Sim' : 'NÃO'} | ` +
              `Ler Histórico: ${canRead ? 'Sim' : 'NÃO'} | ` +
              `Gerenciar Mensagens: ${canManage ? 'Sim' : 'NÃO'}`,
          );
        }
      }

      const message = await channel.messages.fetch(messageId).catch((err) => {
        logger.error(`Erro ao buscar mensagem ${messageId} no canal ${channel.name}: ${err.message} (${err.code})`);
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
          logger.warn(`"${poll.titulo}" - ${userVotes.usuario}: ${numVotos} votos (limite: ${poll.maxVotos})`);

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
                    logger.error(
                      `Sem permissão para remover reação de ${userVotes.usuario}. O bot precisa de "Gerenciar Mensagens"`,
                    );
                  } else {
                    logger.error(`Erro ao remover reação: ${err.message}`);
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
                await user
                  .send(
                    `⚠️ **Votos ajustados em "${poll.titulo}"**\n\n` +
                      `Você havia votado em ${numVotos} opção(ões), mas o limite é ${poll.maxVotos}.\n` +
                      `As ${votosParaRemover} opção(ões) mais recente(s) foram removidas.\n` +
                      `Seus votos atuais: ${userVotes.reacoes.join(', ')}`,
                  )
                  .catch(() => {});
              }
            } catch (e) {
              // Silencioso se não conseguir enviar DM
            }

            violacoesSencontradas++;
            logger.info(`Removidos ${votosParaRemover} voto(s) em excesso de ${userVotes.usuario}`);
          } catch (error) {
            logger.error(`Erro ao remover votos de ${userVotes.usuario}: ${error.message}`);
          }
        }
      }

      if (violacoesSencontradas > 0) {
        logger.info(`"${poll.titulo}": ${violacoesSencontradas} usuário(s) tiveram votos ajustados`);
      }
    } catch (error) {
      logger.error(`Erro ao verificar limites de "${poll.titulo}": ${error.message}`);
    }
  }

  // Remove enquetes órfãs (se ainda não foram removidas na sincronização)
  if (enquetesOrfas.length > 0) {
    logger.info(`Removendo ${enquetesOrfas.length} enquete(s) órfã(s)...`);
    for (const messageId of enquetesOrfas) {
      client.activePolls.delete(messageId);
    }
  }

  // Salva após aplicar limites
  saveActivePolls();
  if (client.activePolls.size > 0) {
    logger.info('Verificação de limites concluída');
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
        logger.error(`Erro ao carregar comando ${file}: ${error.message}`);
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

logger.info(`${client.commands.size} comando(s) carregado(s)`);

// =====================================
// DEPLOY DE COMANDOS
// =====================================
async function deployCommands() {
  try {
    const commands = [];

    // Carrega todos os comandos para registrar
    for (const { command } of loadedCommands) {
      if (command.data && command.execute) {
        commands.push(command.data.toJSON());
      }
    }

    // Cria a instância REST para comunicar com a API do Discord
    const rest = new REST({ version: '10' }).setToken(config.TOKEN);

    // Verifica se CLIENT_ID está definido
    const clientId = config.CLIENT_ID;

    if (!clientId) {
      logger.error('CLIENT_ID não está definido no arquivo .env');
      logger.error('Adicione: CLIENT_ID=seu_client_id_aqui');
      return false;
    }

    // Registra os comandos globalmente (disponível em todos os servidores)
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    return true;
  } catch (error) {
    logger.error(`Erro ao registrar comandos: ${error.message}`);
    return false;
  }
}

// =====================================
// EVENTOS
// =====================================

// Evento: Bot conectado e pronto
client.once('clientReady', async () => {
  logger.info(`${client.user.tag} está ONLINE`);
  client.user.setActivity('📚 Clube do Livro', { type: ActivityType.Watching });

  await bindMensalistasRolesOnStartup();

  // Deploy de comandos se requisitado via variável de ambiente ou flag
  if (config.DEPLOY) {
    logger.info('Registrando comandos...');
    const deploySuccess = await deployCommands();
    if (deploySuccess) {
      logger.info('Deploy concluído com sucesso');
      // Se foi deployment via linha de comando, sai após sucesso
      if (process.argv.includes('--deploy')) {
        process.exit(0);
      }
    } else {
      logger.error('Deploy falhou');
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
      logger.error(`Erro ao processar reação: ${error.message}`);
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
      logger.error(`Erro ao remover reação: ${error.message}`);
    }
  }
});

// =====================================
// SERVIDOR WEB (MANTER BOT ATIVO)
// =====================================

const app = express();
const port = config.PORT;
const dashboardFrontendDist = path.join(__dirname, '../../public');
const isProductionEnv = config.APP_ENV === 'prod';
const redisUrl = process.env.REDIS_URL;

let sessionStore;
if (redisUrl) {
  const redisClient = createClient({ url: redisUrl });
  redisClient.on('error', (err) => logger.error('Redis client error:', err));
  redisClient.connect().catch((err) => logger.error('Redis connection failed:', err));
  sessionStore = new RedisStore({ client: redisClient, ttl: 12 * 60 * 60 });
  logger.info('Sessão do dashboard utilizando RedisStore.');
} else if (isProductionEnv) {
  logger.error('Produção requer REDIS_URL configurado para persistência de sessão.');
  logger.error('Defina REDIS_URL=redis://redis:6379 no arquivo .env');
  process.exit(1);
} else {
  logger.warn('REDIS_URL não configurado. Usando MemoryStore (apenas para desenvolvimento).');
}

if (isProductionEnv) {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(
  session({
    name: 'dashboard.sid',
    secret: process.env.DASHBOARD_SESSION_SECRET || 'dashboard-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProductionEnv ? 'auto' : false,
      maxAge: 12 * 60 * 60 * 1000,
    },
  }),
);

app.get('/api/health', (req, res) => res.send(`Bot Online! [${config.APP_ENV.toUpperCase()}]`));

// Rotas de autenticação do dashboard
const { authRouter: dashboardAuthRouter } = require('../../dashboard/api/auth');
app.use('/api/auth', dashboardAuthRouter);

// Rota para execução de comandos via dashboard
const dashboardCommandsRouter = require('../../dashboard/api/dashboard-commands');
app.use('/api/commands', dashboardCommandsRouter);

// Rota para upload de CSV via dashboard
const dashboardCsvRouter = require('../../dashboard/api/dashboard-csv');
app.use('/api/csv', dashboardCsvRouter);

app.use('/api', (req, res) => {
  return res.status(404).json({ error: 'Endpoint de API não encontrado' });
});

if (fs.existsSync(dashboardFrontendDist)) {
  app.use(express.static(dashboardFrontendDist));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(path.join(dashboardFrontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send(`Bot Online! [${config.APP_ENV.toUpperCase()}]`));
}

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
  logger.info(`Keep-alive rodando na porta ${port}`);
  logger.info(`${client.user.tag} está ONLINE`);
});
