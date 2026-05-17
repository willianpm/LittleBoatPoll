const fs = require('fs');
const path = require('path');
const { REST, Routes, MessageFlags } = require('discord.js');
const config = require('../utils/config');
const logger = require('../utils/logger');

let loadedCommands = [];

function loadCommandsRecursively(dir) {
  const commands = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      commands.push(...loadCommandsRecursively(filePath));
    } else if (file.endsWith('.js')) {
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

function loadIntoClient(client) {
  const commandsPath = path.join(__dirname, '../commands');
  loadedCommands = loadCommandsRecursively(commandsPath);

  for (const { command } of loadedCommands) {
    client.commands.set(command.data.name, command);
  }

  logger.info(`${client.commands.size} comando(s) carregado(s)`);
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

async function executeInteractionCommand(client, interaction, commandTypeLabel, notFoundLabel) {
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

function registerInteractionHandlers(client) {
  client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
      await executeInteractionCommand(client, interaction, '', 'Comando não encontrado');
    }

    if (interaction.isContextMenuCommand()) {
      await executeInteractionCommand(client, interaction, ' de contexto', 'Comando de contexto não encontrado');
    }
  });
}

async function deployCommands() {
  try {
    const commands = [];

    for (const { command } of loadedCommands) {
      if (command.data && command.execute) {
        commands.push(command.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(config.TOKEN);

    const clientId = config.CLIENT_ID;

    if (!clientId) {
      logger.error('CLIENT_ID não está definido no arquivo .env');
      logger.error('Adicione: CLIENT_ID=seu_client_id_aqui');
      return false;
    }

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    return true;
  } catch (error) {
    logger.error(`Erro ao registrar comandos: ${error.message}`);
    return false;
  }
}

module.exports = {
  loadCommandsRecursively,
  loadIntoClient,
  registerInteractionHandlers,
  deployCommands,
  getLoadedCommands: () => loadedCommands,
};
