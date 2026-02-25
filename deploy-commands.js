require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * =====================================
 * DEPLOY DE COMANDOS DISCORD
 * =====================================
 *
 * Este script registra todos os comandos (slash e contexto) no Discord
 * Deve ser executado sempre que adicionar ou modificar comandos
 *
 * Como usar:
 * node deploy-commands.js
 */

// Carrega todos os comandos
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

console.log(`📂 Carregando ${commandFiles.length} comando(s)...`);

let slashCount = 0;
let contextCount = 0;

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (command.data && command.execute) {
    commands.push(command.data.toJSON());

    // Identifica o tipo de comando
    if (command.data.type === 3) {
      // ApplicationCommandType.Message = 3
      console.log(`  ✅ ${command.data.name} (contexto)`);
      contextCount++;
    } else {
      console.log(`  ✅ ${command.data.name} (slash)`);
      slashCount++;
    }
  }
}

// Cria a instância REST para comunicar com a API do Discord
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/**
 * Função principal para registrar os comandos
 */
(async () => {
  try {
    console.log(`\n🔄 Registrando comandos no Discord...`);
    console.log(`   ${slashCount} slash command(s) + ${contextCount} context menu command(s)\n`);

    // Verifica se CLIENT_ID está definido
    const clientId = process.env.CLIENT_ID;

    if (!clientId) {
      console.error('❌ ERRO: CLIENT_ID não está definido no arquivo .env');
      console.error('   Adicione: CLIENT_ID=seu_client_id_aqui');
      process.exit(1);
    }

    // Registra os comandos globalmente (disponível em todos os servidores)
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(`✅ ${data.length} comando(s) registrado(s) com sucesso!`);
    console.log('\n📋 Comandos disponíveis:');
    data.forEach((cmd) => {
      const tipo = cmd.type === 3 ? '🖱️ (contexto)' : '💬 (slash)';
      const descricao = cmd.description ? ` - ${cmd.description}` : '';
      console.log(`  ${tipo} ${cmd.name}${descricao}`);
    });
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
    process.exit(1);
  }
})();
