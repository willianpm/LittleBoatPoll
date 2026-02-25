require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ChannelType, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

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
});

// Criamos uma coleção para armazenar os comandos slash
client.commands = new Collection();

// Estrutura para armazenar votações ativas em memória
client.activePolls = new Map();

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

// Carrega votações ativas do arquivo
function loadActivePolls() {
  try {
    if (fs.existsSync('./active-polls.json')) {
      const pollsArray = JSON.parse(fs.readFileSync('./active-polls.json', 'utf8'));
      client.activePolls = new Map(pollsArray);
      console.log(`📊 ${pollsArray.length} votação(ões) ativa(s) carregada(s)`);
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
    console.log('✅ Arquivo mensalistas.json criado');
  }

  // historico-votacoes.json
  if (!fs.existsSync('./historico-votacoes.json')) {
    fs.writeFileSync('./historico-votacoes.json', JSON.stringify({ votacoes: [] }, null, 2));
    console.log('✅ Arquivo historico-votacoes.json criado');
  }

  // cargos-criadores.json
  if (!fs.existsSync('./cargos-criadores.json')) {
    fs.writeFileSync('./cargos-criadores.json', JSON.stringify({ cargos: [] }, null, 2));
    console.log('✅ Arquivo cargos-criadores.json criado');
  }
}

// Inicializa arquivos de dados
ensureDataFiles();
loadActivePolls();

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
    console.log(`✅ Comando carregado: ${command.data.name}`);
  }
}

// =====================================
// EVENTOS
// =====================================

// Evento: Bot conectado e pronto
client.once('clientReady', () => {
  console.log(`\n✅ LittleBoatPoll está ONLINE como ${client.user.tag}!`);
  console.log(`📊 Gerenciador de Clube do Livro iniciado\n`);
  client.user.setActivity('📚 Clube do Livro', { type: ActivityType.Watching });
});

// Evento: Interação criada (Slash Commands, Context Menu, Buttons, etc)
client.on('interactionCreate', async (interaction) => {
  // Processa comandos slash
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`⚠️ Comando não encontrado: ${interaction.commandName}`);
      return;
    }

    try {
      console.log(`📝 Executando comando: /${interaction.commandName} - Usuário: ${interaction.user.tag}`);
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
      console.error(`⚠️ Comando de contexto não encontrado: ${interaction.commandName}`);
      return;
    }

    try {
      console.log(`🖱️ Executando comando de contexto: ${interaction.commandName} - Usuário: ${interaction.user.tag}`);
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

    // Busca a votação ativa para esta mensagem
    const poll = client.activePolls.get(reaction.message.id);
    if (!poll) return;

    const emoji = reaction.emoji.name;
    console.log(`🔔 ${user.username} reagiu com ${emoji}`);

    // Verifica se o emoji é válido para esta enquete
    if (!poll.emojiNumeros.includes(emoji)) {
      // Emoji não faz parte desta enquete, remove
      await reaction.users.remove(user.id);
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

    // Verifica se atingiu o limite de votos
    if (poll.votos[user.id].reacoes.length >= poll.maxVotos) {
      // Remove a reação e notifica (se possível)
      await reaction.users.remove(user.id);
      try {
        await user.send(`❌ Você já atingiu o limite de **${poll.maxVotos}** voto(s) nesta enquete: "${poll.titulo}"`);
      } catch (e) {
        console.log(`Não foi possível enviar DM para ${user.username}`);
      }
      return;
    }

    // Adiciona a reação
    poll.votos[user.id].reacoes.push(emoji);
    console.log(`✅ ${user.username} votou em ${emoji} (${poll.votos[user.id].reacoes.length}/${poll.maxVotos})`);

    // Salva as votações após cada mudança
    saveActivePolls();
  } catch (error) {
    console.error('Erro ao processar reação:', error);
  }
});

// Evento: Reação removida
client.on('messageReactionRemove', async (reaction, user) => {
  try {
    if (user.bot) return;

    const poll = client.activePolls.get(reaction.message.id);
    if (!poll) return;

    const emoji = reaction.emoji.name;
    console.log(`🗑️ ${user.username} removeu a reação ${emoji}`);

    // Remove apenas esta reação específica
    if (poll.votos[user.id] && poll.votos[user.id].reacoes) {
      const index = poll.votos[user.id].reacoes.indexOf(emoji);
      if (index > -1) {
        poll.votos[user.id].reacoes.splice(index, 1);
        console.log(`✅ Reação ${emoji} removida de ${user.username}`);

        // Se não tem mais reações, remove o usuário completamente
        if (poll.votos[user.id].reacoes.length === 0) {
          delete poll.votos[user.id];
          console.log(`🗑️ ${user.username} não tem mais votos`);
        }
      }
    }

    // Salva as votações após cada mudança
    saveActivePolls();
  } catch (error) {
    console.error('Erro ao remover reação:', error);
  }
});

// =====================================
// SERVIDOR WEB (MANTER BOT ATIVO)
// =====================================
const app = express();
const port = process.env.PORT || 8000; // O Koyeb injeta a porta automaticamente

app.get('/', (req, res) => res.send('Bot Online!'));

app.listen(port, () => {
  console.log(`🌐 Keep-alive rodando na porta ${port}`);
});

// =====================================
// LOGIN DO BOT
// =====================================
client.login(process.env.TOKEN);
