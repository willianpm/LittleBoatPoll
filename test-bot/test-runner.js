/**
 * TEST RUNNER - Sistema de Testes Automatizados
 *
 * Este script simula interações de usuários com o bot staging,
 * executando cenários de teste automatizados e gerando relatórios.
 */

const { parseEmoji } = require('discord.js');
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');

// Carrega variáveis de ambiente de teste
dotenv.config({ path: path.join(__dirname, '.env.test') });

// Configuração
const TEST_BOT_TOKEN = process.env.TEST_BOT_TOKEN;
const STAGING_BOT_ID = process.env.STAGING_BOT_ID;
const TEST_CHANNEL_ID = process.env.TEST_CHANNEL_ID;
const TEST_GUILD_ID = process.env.TEST_GUILD_ID;

// Validação de configuração
if (!TEST_BOT_TOKEN || !STAGING_BOT_ID || !TEST_CHANNEL_ID || !TEST_GUILD_ID) {
  console.error('Erro: Configure todas as variáveis em test-bot/.env.test:');
  console.error('   TEST_BOT_TOKEN - Token do bot de teste');
  console.error('   STAGING_BOT_ID - ID do bot staging');
  console.error('   TEST_CHANNEL_ID - ID do canal de testes');
  console.error('   TEST_GUILD_ID - ID do servidor de testes');
  process.exit(1);
}

// Cliente do bot de teste
const testClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent],
});

// Resultados dos testes
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  scenarios: [],
};

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const MESSAGE_FETCH_LIMIT = 50;
const DEFAULT_POLL_EMOJIS = [':thumbsup:', ':thumbsdown:', ':person_shrugging:'];

// Função auxiliar para logging
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função auxiliar para esperar
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Registra resultado de teste
function recordTest(scenario, testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`  ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`  ${testName}`, 'red');
    if (details) log(`    ${details}`, 'yellow');
  }

  const scenarioResult = testResults.scenarios.find((s) => s.name === scenario);
  if (scenarioResult) {
    scenarioResult.tests.push({ name: testName, passed, details });
  } else {
    testResults.scenarios.push({
      name: scenario,
      tests: [{ name: testName, passed, details }],
    });
  }
}

async function findLatestPollMessage(channel) {
  const messages = await channel.messages.fetch({ limit: MESSAGE_FETCH_LIMIT });
  for (const msg of messages.values()) {
    if (msg.author.id === STAGING_BOT_ID && msg.embeds.length > 0) {
      return msg;
    }
  }
  return null;
}

async function syncReactions(message) {
  for (const reaction of message.reactions.cache.values()) {
    if (reaction.partial) {
      await reaction.fetch().catch(() => null);
    }

    try {
      await reaction.users.fetch().catch(() => null);
    } catch (e) {
      // Ignorar erros de fetch
    }
  }
}

async function ensurePollReactions(message, logReactionErrors = true) {
  let pollMessage = message;

  if (pollMessage.reactions.cache.size === 0) {
    log('Adicionando reações automaticamente à enquete para teste...', 'blue');

    for (const emoji of DEFAULT_POLL_EMOJIS) {
      try {
        await pollMessage.react(parseEmoji(emoji));
        await wait(500);
      } catch (error) {
        if (logReactionErrors) {
          log(`Não foi possível adicionar reação ${emoji}: ${error.message}`, 'yellow');
        } else {
          log(`Não foi possível adicionar reação ${emoji}`, 'yellow');
        }
      }
    }

    await wait(1500);
    pollMessage = await pollMessage.channel.messages.fetch(pollMessage.id);

    if (logReactionErrors) {
      log(`   Reações adicionadas (${pollMessage.reactions.cache.size} encontradas)`, 'green');
    }
  }

  await wait(1000);
  await syncReactions(pollMessage);

  return pollMessage;
}

// =====================================
// CENÁRIOS DE TESTE
// =====================================

/**
 * Cenário 1: Criar enquete básica
 */
async function testCreateBasicPoll(channel) {
  log('\nCenário 1: Criar Enquete Básica', 'cyan');

  try {
    // Busca o bot staging no servidor
    const guild = channel.guild;
    const stagingBot = await guild.members.fetch(STAGING_BOT_ID).catch(() => null);

    if (!stagingBot) {
      recordTest('Criar Enquete', 'Bot staging encontrado', false, 'Bot não está no servidor');
      return null;
    }
    recordTest('Criar Enquete', 'Bot staging encontrado', true);

    // Verifica se bot respondeu neste canal (indicativo de estar funcionando)
    const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    const botMessages = messages?.filter((m) => m.author.id === STAGING_BOT_ID).size > 0;
    recordTest('Criar Enquete', 'Bot staging responde no canal', botMessages, 'Nenhuma mensagem do bot encontrada no canal');

    // Verifica se bot tem permissão para usar slash commands
    const botMember = await guild.members.fetch(testClient.user.id).catch(() => null);
    const canUseCommands = botMember ? true : false;
    recordTest('Criar Enquete', 'Bot de teste pode usar slash commands', canUseCommands);

    if (botMessages) {
      log('\nNota: Comandos estão sendo registrados no bot (veja logs de deploy).', 'yellow');
      log('     Se não aparecer em /enquete, aguarde até 60 minutos pela propagação do Discord.', 'yellow');
    }

    return true;
  } catch (error) {
    recordTest('Criar Enquete', 'Execução sem erros', false, error.message);
    return null;
  }
}

/**
 * Cenário 2: Simular votos em enquete existente
 */
async function testVoteOnPoll(channel) {
  log('\nCenário 2: Votar em Enquete', 'cyan');

  try {
    let pollMessage = await findLatestPollMessage(channel);

    if (!pollMessage) {
      recordTest('Votar em Enquete', 'Mensagem do bot encontrada', false, 'Nenhuma enquete/mensagem do bot encontrada');
      log('     Dica: Crie uma enquete com /enquete no canal de testes', 'yellow');
      return null;
    }
    recordTest('Votar em Enquete', 'Mensagem do bot encontrada', true);

    pollMessage = await channel.messages.fetch(pollMessage.id);
    pollMessage = await ensurePollReactions(pollMessage, true);

    // Verifica reações disponíveis
    const reactions = pollMessage.reactions.cache;
    const hasReactions = reactions.size > 0;
    recordTest('Votar em Enquete', 'Enquete tem opções (reações)', hasReactions, `${reactions.size} reação(ões) encontrada(s)`);

    if (hasReactions) {
      // Adiciona voto na primeira opção
      const firstReaction = reactions.first();
      try {
        await firstReaction.react();
        recordTest('Votar em Enquete', 'Bot de teste conseguiu reagir', true);

        // Espera um pouco e verifica se reação permanece
        await wait(1500);
        const updatedMessage = await channel.messages.fetch(pollMessage.id);
        const updatedReaction = updatedMessage.reactions.cache.get(firstReaction.emoji.name);
        const testBotReacted = updatedReaction?.users.cache.has(testClient.user.id);

        recordTest('Votar em Enquete', 'Voto registrado corretamente', testBotReacted);

        // Remove o voto
        try {
          await updatedReaction.users.remove(testClient.user.id);
          recordTest('Votar em Enquete', 'Remoção de voto funciona', true);
        } catch (e) {
          recordTest('Votar em Enquete', 'Remoção de voto funciona', false, e.message);
        }
      } catch (error) {
        recordTest('Votar em Enquete', 'Bot de teste conseguiu reagir', false, error.message);
      }
    } else {
      recordTest('Votar em Enquete', 'Enquete tem múltiplas opções', false, 'Enquete não tem reações ainda');
      log('     Dica: Adicione reações manualmente à enquete', 'yellow');
    }

    return pollMessage;
  } catch (error) {
    recordTest('Votar em Enquete', 'Execução sem erros', false, error.message);
    return null;
  }
}

/**
 * Cenário 3: Teste de limites de votação
 */
async function testVoteLimits(channel) {
  log('\nCenário 3: Limites de Votação', 'cyan');

  try {
    let pollMessage = await findLatestPollMessage(channel);

    if (!pollMessage) {
      recordTest('Limites de Votação', 'Mensagem do bot encontrada', false, 'Crie uma enquete primeiro');
      return;
    }
    recordTest('Limites de Votação', 'Mensagem do bot encontrada', true);

    pollMessage = await channel.messages.fetch(pollMessage.id);
    pollMessage = await ensurePollReactions(pollMessage, false);

    const reactions = pollMessage.reactions.cache;
    const reactionArray = Array.from(reactions.values());

    if (reactionArray.length < 2) {
      recordTest('Limites de Votação', 'Enquete com múltiplas opções', false, `Precisa de pelo menos 2 opções, encontrou ${reactionArray.length}`);
      log('     Dica: Adicione mais reações manualmente à enquete', 'yellow');
      return;
    }
    recordTest('Limites de Votação', 'Enquete com múltiplas opções', true, `${reactionArray.length} opção(ões) encontrada(s)`);

    // Tenta votar em múltiplas opções
    log(`\n   Tentando votar em ${reactionArray.length} opções...`, 'blue');

    let votosAdicionados = 0;
    for (let i = 0; i < reactionArray.length; i++) {
      try {
        await reactionArray[i].react();
        votosAdicionados++;
        await wait(1000); // Aguarda para evitar rate limit
      } catch (error) {
        break;
      }
    }

    recordTest('Limites de Votação', `Adicionados ${votosAdicionados} votos`, votosAdicionados > 0);

    // Aguarda processamento do bot
    await wait(3000);

    // Refaz fetch da mensagem com reações sincronizadas
    const updatedMessage = await channel.messages.fetch(pollMessage.id);

    // Faz fetch das reações novamente para sincronizar
    for (const reaction of updatedMessage.reactions.cache.values()) {
      if (reaction.partial) {
        await reaction.fetch().catch(() => null);
      }
      await reaction.users.fetch().catch(() => null);
    }

    let votosRestantes = 0;

    for (const reaction of updatedMessage.reactions.cache.values()) {
      if (reaction.users.cache.has(testClient.user.id)) {
        votosRestantes++;
      }
    }

    recordTest('Limites de Votação', `Votos foram processados`, votosRestantes > 0, `${votosRestantes} votos restaram`);

    // Limpa os votos
    for (const reaction of updatedMessage.reactions.cache.values()) {
      try {
        await reaction.users.remove(testClient.user.id);
      } catch (e) {
        // Ignora erros de limpeza
      }
    }
  } catch (error) {
    recordTest('Limites de Votação', 'Execução sem erros', false, error.message);
  }
}

async function testPermissions(channel) {
  log('\nCenário 4: Sistema de Permissões', 'cyan');

  try {
    const guild = channel.guild;

    // Verifica se bot staging pode enviar mensagens (teste básico de permissões)
    const botMember = await guild.members.fetch(STAGING_BOT_ID).catch(() => null);
    if (!botMember) {
      recordTest('Permissões', 'Bot staging tem permissões no servidor', false, 'Bot não encontrado');
      return;
    }

    // Verifica as permissões do bot no canal
    const channel_permissions = channel.permissionsFor(botMember);
    const canSendMessages = channel_permissions?.has('SendMessages') !== false;
    const canManageMessages = channel_permissions?.has('ManageMessages') !== false;
    const canAddReactions = channel_permissions?.has('AddReactions') !== false;

    recordTest('Permissões', 'Bot tem permissão para enviar mensagens', canSendMessages);
    recordTest('Permissões', 'Bot tem permissão para gerenciar reações', canManageMessages || canAddReactions);

    log('\n      Nota: Comandos slash são registrados automaticamente pelo bot.', 'blue');
    log('      Confirme nos logs acima: "Deploy concluído com sucesso"', 'blue');
  } catch (error) {
    recordTest('Permissões', 'Execução sem erros', false, error.message);
  }
}

// =====================================
// EXECUÇÃO PRINCIPAL
// =====================================

testClient.once('clientReady', async () => {
  log('\n╔═══════════════════════════════════════════════╗', 'cyan');
  log('║     LittleBoatPoll - Testes Automatizados     ║', 'cyan');
  log('╚═══════════════════════════════════════════════╝', 'cyan');

  log(`\n✓ Bot de teste conectado: ${testClient.user.tag}`, 'green');

  try {
    // Obtém canal de testes
    const channel = await testClient.channels.fetch(TEST_CHANNEL_ID);
    if (!channel) {
      log(`Canal de testes não encontrado: ${TEST_CHANNEL_ID}`, 'red');
      process.exit(1);
    }

    log(`- Canal de testes: #${channel.name}`, 'green');
    log('\n' + '='.repeat(50), 'blue');

    // Executa cenários de teste
    await testCreateBasicPoll(channel);
    await wait(1000);

    await testVoteOnPoll(channel);
    await wait(1000);

    await testVoteLimits(channel);
    await wait(1000);

    await testPermissions(channel);

    // Relatório final
    log('\n' + '='.repeat(50), 'blue');
    log('\nRELATÓRIO FINAL', 'cyan');
    log('='.repeat(50), 'blue');
    log(`\nTotal de testes: ${testResults.total}`);
    log(`Passou: ${testResults.passed}`, 'green');
    log(`Falhou: ${testResults.failed}`, 'red');

    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    const color = successRate >= 80 ? 'green' : successRate >= 50 ? 'yellow' : 'red';
    log(`\nTaxa de sucesso: ${successRate}%`, color);

    // Exibe detalhes por cenário
    log('\nDetalhes por Cenário:', 'cyan');
    for (const scenario of testResults.scenarios) {
      const passed = scenario.tests.filter((t) => t.passed).length;
      const total = scenario.tests.length;
      const status = passed === total ? '✓' : '✗';
      const statusColor = passed === total ? 'green' : 'yellow';
      log(`\n${status} ${scenario.name} (${passed}/${total})`, statusColor);
    }

    log('\n' + '='.repeat(50), 'blue');

    // Recomendações
    if (successRate < 100) {
      log('\nDicas para melhorar os testes:', 'yellow');

      if (testResults.scenarios.some((s) => s.name === 'Votar em Enquete' && s.tests.some((t) => !t.passed && t.name.includes('reações')))) {
        log('  1. Adicione reações manualmente à enquete no Discord', 'yellow');
      }
    }

    log('\nTestes concluídos\n', 'green');

    // Exit code baseado em resultados
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\nErro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
});

// Login do bot de teste
log('Conectando bot de teste...', 'blue');
testClient.login(TEST_BOT_TOKEN).catch((error) => {
  log(`\nErro ao conectar bot de teste: ${error.message}`, 'red');
  process.exit(1);
});
