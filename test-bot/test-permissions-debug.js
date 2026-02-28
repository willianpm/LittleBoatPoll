/**
 * TESTE: Sistema de Permissões - Debug de Toggle Buttons
 * 
 * Este script testa a verificação de permissões para comandos de contexto (toggle)
 * e valida se usuários com cargo "Criador de Enquete" conseguem executar os comandos.
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config({ path: '.env.test' });

const TEST_BOT_TOKEN = process.env.TEST_BOT_TOKEN;
const TEST_GUILD_ID = process.env.TEST_GUILD_ID;
const TEST_CHANNEL_ID = process.env.TEST_CHANNEL_ID;
const TEST_USER_ID = process.env.TEST_USER_ID; // ID do usuário que vai testar

async function testPermissionSystem() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TESTE: Sistema de Permissões');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.GuildMember],
  });

  return new Promise((resolve, reject) => {
    client.once('ready', async () => {
      try {
        console.log(`✅ Bot conectado: ${client.user.tag}\n`);

        // 1. Busca a guild
        console.log('📋 Buscando servidor...');
        const guild = await client.guilds.fetch(TEST_GUILD_ID);
        console.log(`✅ Servidor: ${guild.name}\n`);

        // 2. Busca o usuário de teste
        console.log('👤 Buscando usuário de teste...');
        const member = await guild.members.fetch(TEST_USER_ID);
        console.log(`✅ Usuário: ${member.user.tag} (${member.id})\n`);

        // 3. Verifica cargos do usuário
        console.log('🎫 Cargos do usuário:');
        const roles = member.roles.cache
          .filter(role => role.id !== guild.id) // Remove @everyone
          .map(role => `   - ${role.name} (${role.id})`);
        
        if (roles.length === 0) {
          console.log('   ⚠️ Usuário não tem cargos');
        } else {
          roles.forEach(role => console.log(role));
        }
        console.log();

        // 4. Verifica se é admin
        console.log('🔐 Permissões do Discord:');
        const isAdmin = member.permissions.has('Administrator');
        const isOwner = guild.ownerId === member.id;
        console.log(`   - Administrador: ${isAdmin ? '✅ Sim' : '❌ Não'}`);
        console.log(`   - Dono do servidor: ${isOwner ? '✅ Sim' : '❌ Não'}`);
        console.log();

        // 5. Verifica arquivos de configuração
        console.log('📁 Verificando arquivos de configuração...');
        const fs = require('fs');
        const path = require('path');
        
        const criadoresPath = path.join(__dirname, '..', 'criadores-internos.json');
        const roleBindingsPath = path.join(__dirname, '..', 'data', 'prod', 'role-bindings.json');

        // Criadores internos
        if (fs.existsSync(criadoresPath)) {
          const criadores = JSON.parse(fs.readFileSync(criadoresPath, 'utf-8'));
          console.log('✅ criadores-internos.json encontrado');
          console.log('   Criadores:', criadores.criadores);
          console.log('   Usuário está na lista?', criadores.criadores.includes(member.id) ? '✅ SIM' : '❌ NÃO');
        } else {
          console.log('⚠️ criadores-internos.json NÃO encontrado');
        }
        console.log();

        // Role bindings
        if (fs.existsSync(roleBindingsPath)) {
          const roleBindings = JSON.parse(fs.readFileSync(roleBindingsPath, 'utf-8'));
          console.log('✅ role-bindings.json encontrado');
          
          const adminRoles = roleBindings.adminRoleIdsByGuild?.[TEST_GUILD_ID] || [];
          console.log(`   Cargos autorizados para esta guild:`, adminRoles);
          
          if (adminRoles.length > 0) {
            const hasAuthorizedRole = adminRoles.some(roleId => member.roles.cache.has(roleId));
            console.log(`   Usuário tem cargo autorizado?`, hasAuthorizedRole ? '✅ SIM' : '❌ NÃO');
          } else {
            console.log('   ⚠️ Nenhum cargo autorizado configurado');
          }
        } else {
          console.log('⚠️ role-bindings.json NÃO encontrado');
        }
        console.log();

        // 6. Simula a verificação de permissões
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 SIMULAÇÃO: Verificação de Permissões');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Importa a função de permissões
        const { isCriador } = require('../utils/permissions');
        
        console.log('Executando isCriador()...\n');
        const hasPermission = isCriador(member, guild.id);
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 RESULTADO FINAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\nUsuário ${member.user.tag}:`);
        console.log(hasPermission 
          ? '✅ TEM PERMISSÃO para usar comandos administrativos'
          : '❌ NÃO TEM PERMISSÃO para usar comandos administrativos'
        );
        console.log();

        // 7. Recomendações
        if (!hasPermission) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('💡 RECOMENDAÇÕES');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('\nPara conceder permissão, faça UMA das opções:\n');
          console.log('1️⃣ Adicionar à lista de criadores internos:');
          console.log(`   /criador-de-enquete adicionar @${member.user.username}\n`);
          console.log('2️⃣ Dar permissão de Administrador no Discord\n');
          console.log('3️⃣ Configurar um cargo autorizado em role-bindings.json');
          console.log(`   e dar esse cargo ao usuário\n`);
        }

        client.destroy();
        resolve();

      } catch (error) {
        console.error('❌ Erro durante o teste:', error);
        client.destroy();
        reject(error);
      }
    });

    client.login(TEST_BOT_TOKEN).catch(reject);
  });
}

// Executa o teste
if (require.main === module) {
  testPermissionSystem()
    .then(() => {
      console.log('\n✅ Teste concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Teste falhou:', error);
      process.exit(1);
    });
}

module.exports = { testPermissionSystem };
