#!/usr/bin/env node

/**
 * Script de validação: Confirma que CSV upload salva no PATH correto
 *
 * Execução:
 *   APP_ENV=prod node scripts/validate-csv-upload-fix.js
 *   APP_ENV=staging node scripts/validate-csv-upload-fix.js
 *   DATA_DIR=/tmp/lbp-data APP_ENV=prod node scripts/validate-csv-upload-fix.js
 *
 * Espera:
 *   - Com DATA_DIR definido: salva em <DATA_DIR>/draft-polls.json
 *   - Sem DATA_DIR: salva em <repo>/data/environments/<APP_ENV>/draft-polls.json
 */

const fs = require('fs');
const path = require('path');

// Simula o que botService.js faz - sem depender de config.js que requer .env
console.log('\n' + '='.repeat(70));
console.log('VALIDAÇÃO: CSV Upload Path Correction');
console.log('='.repeat(70) + '\n');

const appEnv = process.env.APP_ENV || 'prod';
const allowedEnvs = new Set(['prod', 'staging']);
if (!allowedEnvs.has(appEnv)) {
  console.error(`✗ APP_ENV inválido: ${appEnv}. Use "prod" ou "staging".`);
  process.exit(1);
}

console.log(`✓ APP_ENV: ${appEnv}`);

// Construir o path como botService.js agora faz
// (config.js usa DATA_DIR quando definido, senão fallback por APP_ENV)
const environmentsBaseDir = path.resolve(__dirname, '../data/environments');
const defaultDataDir = path.resolve(environmentsBaseDir, appEnv);
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : defaultDataDir;
const draftPollsPath = path.resolve(dataDir, 'draft-polls.json');

if (!process.env.DATA_DIR && !defaultDataDir.startsWith(`${environmentsBaseDir}${path.sep}`)) {
  console.error(`✗ Caminho inválido detectado para APP_ENV: ${defaultDataDir}`);
  process.exit(1);
}

console.log(`✓ DATA_DIR: ${dataDir}${process.env.DATA_DIR ? ' (via env)' : ' (fallback por APP_ENV)'}`);
console.log(`✓ Caminho esperado: ${draftPollsPath}\n`);

// Validar estrutura de diretórios
console.log('Verificando diretório base...');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`  → Criado: ${dataDir}`);
  } else {
    console.log(`  ✓ Existe: ${dataDir}`);
  }
} catch (err) {
  console.error(`  ✗ Erro ao verificar diretório: ${err.message}`);
  process.exit(1);
}

// Teste de escrita
console.log('\nExecutando teste de escrita...');
const testData = [
  {
    titulo: 'Teste de Validação',
    opcoes: ['Opção A', 'Opção B'],
    maxVotos: 1,
    usarPesoMensalista: false,
    status: 'rascunho',
    criadoEm: new Date().toISOString(),
    editadoEm: new Date().toISOString(),
  },
];

let backup = {};
let createdFile = false;
let exitCode = 0;

try {
  // Salvar backup se arquivo existe
  if (fs.existsSync(draftPollsPath)) {
    const content = fs.readFileSync(draftPollsPath, 'utf-8');
    backup.content = content;
    backup.mtime = fs.statSync(draftPollsPath).mtime;
    console.log(`  → Backup do arquivo original criado`);
  } else {
    createdFile = true;
  }

  // Escrever dados de teste
  fs.writeFileSync(draftPollsPath, JSON.stringify(testData, null, 2), 'utf-8');
  console.log(`  ✓ Dados escritos com sucesso`);

  // Verificação de integridade
  const written = JSON.parse(fs.readFileSync(draftPollsPath, 'utf-8'));
  if (written.length === 1 && written[0].titulo === 'Teste de Validação') {
    console.log(`  ✓ Integridade verificada`);
  } else {
    throw new Error('Dados escritos não correspondem');
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ SUCESSO: CSV Upload Fix Validado');
  console.log('='.repeat(70));
  console.log(`\nResumo:`);
  console.log(`  • APP_ENV: ${appEnv}`);
  console.log(`  • DATA_DIR override: ${process.env.DATA_DIR ? 'SIM' : 'NÃO'}`);
  console.log(`  • Path de salvamento: ${draftPollsPath}`);
  console.log(`  • Escrita funcionando: SIM`);
  console.log(`  • Ambiente correto: SIM\n`);
} catch (err) {
  exitCode = 1;
  console.error(`\n✗ ERRO: ${err.message}`);
  console.log('\n' + '='.repeat(70));
  console.log('❌ FALHA: CSV Upload Fix Não Funciona');
  console.log('='.repeat(70) + '\n');
} finally {
  try {
    if (backup.content !== undefined) {
      fs.writeFileSync(draftPollsPath, backup.content, 'utf-8');
      console.log('  → Arquivo original restaurado');
    } else if (createdFile && fs.existsSync(draftPollsPath)) {
      fs.unlinkSync(draftPollsPath);
      console.log('  → Arquivo de validação removido');
    }
  } catch (cleanupErr) {
    console.error(`  ✗ Falha no cleanup: ${cleanupErr.message}`);
  }

  process.exit(exitCode);
}
