#!/usr/bin/env node

/**
 * Script de Migração de Dados para Sistema Multi-Ambiente
 *
 * Este script migra dados da raiz do projeto (estrutura antiga)
 * para a nova estrutura data/prod/ sem perda de informações.
 *
 * Uso: node scripts/migrate-data.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PROD_DATA_DIR = path.join(ROOT_DIR, 'data', 'prod');

// Arquivos a migrar
const FILES_TO_MIGRATE = ['active-polls.json', 'draft-polls.json', 'mensalistas.json', 'role-bindings.json', 'criadores-internos.json', 'historico-votacoes.json'];

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║          Migração de Dados - Little Boat Poll          ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Garante que o diretório de produção existe
if (!fs.existsSync(PROD_DATA_DIR)) {
  fs.mkdirSync(PROD_DATA_DIR, { recursive: true });
  console.log(`Diretório criado: ${PROD_DATA_DIR}\n`);
}

let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

// Migra cada arquivo
for (const fileName of FILES_TO_MIGRATE) {
  const sourcePath = path.join(ROOT_DIR, fileName);
  const destPath = path.join(PROD_DATA_DIR, fileName);

  // Verifica se o arquivo fonte existe
  if (!fs.existsSync(sourcePath)) {
    console.log(`- ${fileName} - não existe na raiz (ok, será criado automaticamente)`);
    skippedCount++;
    continue;
  }

  // Verifica se já foi migrado
  if (fs.existsSync(destPath)) {
    console.log(`- ${fileName} - já existe em data/prod/ (pulando)`);
    skippedCount++;
    continue;
  }

  try {
    // Copia o arquivo
    fs.copyFileSync(sourcePath, destPath);
    console.log(`${fileName} - migrado com sucesso`);
    migratedCount++;
  } catch (error) {
    console.error(`${fileName} - erro ao migrar: ${error.message}`);
    errorCount++;
  }
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     Resumo da Migração                                 ║');
console.log('╚════════════════════════════════════════════════════════╝\n');
console.log(`Migrados: ${migratedCount}`);
console.log(`Pulados:  ${skippedCount}`);
console.log(`Erros:    ${errorCount}\n`);

if (migratedCount > 0) {
  console.log('Migração concluída com sucesso!\n');
  console.log('PRÓXIMOS PASSOS:\n');
  console.log('1. Verifique os dados em data/prod/');
  console.log('2. Faça backup dos arquivos da raiz (se necessário)');
  console.log('3. Execute o bot: npm start');
  console.log('4. Os arquivos da raiz podem ser mantidos como backup\n');
} else if (errorCount > 0) {
  console.log('Migração falhou com erros. Verifique os logs acima.\n');
  process.exit(1);
} else {
  console.log('Nenhum arquivo foi migrado (já estão em data/prod/ ou não existem).\n');
  console.log('O bot criará os arquivos automaticamente na primeira execução.\n');
}
