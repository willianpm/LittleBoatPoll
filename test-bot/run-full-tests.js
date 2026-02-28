#!/usr/bin/env node

/**
 * Script para executar testes automatizados
 *
 * Inicia o bot staging, aguarda estar online, roda os testes,
 * e depois para o bot. Funciona em Windows, Linux e Mac.
 */

const { spawn } = require('child_process');
const path = require('path');
const WORKDIR = path.join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnInWorkspace(command, args, options = {}) {
  return spawn(command, args, {
    cwd: WORKDIR,
    shell: true,
    ...options,
  });
}

function pipeProcessOutput(processHandle, onChunk) {
  processHandle.stdout.on('data', (data) => {
    const chunk = data.toString();
    onChunk(chunk);
    process.stdout.write(data);
  });

  processHandle.stderr.on('data', (data) => {
    const chunk = data.toString();
    onChunk(chunk);
    process.stderr.write(data);
  });
}

async function waitForStagingReady(getOutput, timeoutMs = 40000) {
  const startTime = Date.now();
  let isOnline = false;
  let isDeployed = false;

  while (Date.now() - startTime < timeoutMs) {
    const output = getOutput();

    if (output.includes('está ONLINE')) {
      isOnline = true;
    }

    if (output.includes('Deploy concluído com sucesso')) {
      isDeployed = true;
      break;
    }

    await wait(500);
  }

  return { isOnline, isDeployed };
}

async function waitForProcessExit(processHandle) {
  await new Promise((resolve, reject) => {
    processHandle.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Testes falharam com código ${code}`));
      }
    });

    processHandle.on('error', reject);
  });
}

async function main() {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║  🧪 Iniciando Suite Completa de Testes        ║', 'cyan');
  log('╚════════════════════════════════════════════════╝\n', 'cyan');

  let stagingProcess = null;
  let stagingOutput = '';

  try {
    // =====================================
    // 1. INICIAR BOT STAGING
    // =====================================
    log('📡 Etapa 1: Iniciando bot staging...', 'blue');

    stagingProcess = spawnInWorkspace('npm', ['run', 'start:staging'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    pipeProcessOutput(stagingProcess, (chunk) => {
      stagingOutput += chunk;
    });

    // Aguarda bot ficar online
    log('\n⏳ Aguardando bot ficar online e sincronizar (máx 40s)...', 'blue');
    const { isOnline, isDeployed } = await waitForStagingReady(() => stagingOutput);

    if (!isOnline) {
      throw new Error('Bot staging demorou muito para ficar online (40s timeout)');
    }

    if (!isDeployed) {
      log('⚠️  Deploy pode não ter completado, mas continuando...', 'yellow');
    }

    log('✓ Bot staging pronto!', 'green');

    // Aguarda um pouco extra para garantir estabilidade
    await wait(2000);

    // =====================================
    // 2. EXECUTAR TESTES
    // =====================================
    log('\n🧪 Etapa 2: Executando testes automatizados...', 'blue');
    log('═'.repeat(50), 'blue');

    const testProcess = spawnInWorkspace('node', ['test-bot/test-runner.js'], {
      stdio: 'inherit',
    });

    await waitForProcessExit(testProcess);

    // =====================================
    // 3. RESULTADO FINAL
    // =====================================
    log('\n═'.repeat(50), 'blue');
    log('\n✅ Suite de testes concluída com sucesso!', 'green');
    log('\nPróximas etapas:', 'cyan');
    log('  1. Revisar os resultados acima', 'blue');
    log('  2. Corrigir quaisquer testes que falharam', 'blue');
    log('  3. Fazer commit das alterações', 'blue');

    process.exit(0);
  } catch (error) {
    log('\n❌ Erro ao executar suite de testes:', 'red');
    log(`   ${error.message}`, 'red');

    if (error.message.includes('demorou muito')) {
      log('\n💡 Dicas:', 'yellow');
      log('   • Verifique se o bot staging está configurado corretamente', 'yellow');
      log('   • Verifique os tokens em .env.staging', 'yellow');
      log('   • Verifique a conexão com a internet', 'yellow');
      log('   • Verifique se o bot tem permissões no servidor Discord', 'yellow');
    }

    process.exit(1);
  } finally {
    // =====================================
    // 4. LIMPAR: PARAR BOT STAGING
    // =====================================
    if (stagingProcess) {
      log('\n🛑 Parando bot staging...', 'blue');
      try {
        stagingProcess.kill('SIGTERM');
        // Aguarda graceful shutdown
        await wait(2000);
        if (!stagingProcess.killed) {
          stagingProcess.kill('SIGKILL');
        }
        log('✓ Bot staging parado', 'green');
      } catch (e) {
        // Ignorar erros ao parar
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
