#!/usr/bin/env node
/**
 * Script CLI para adicionar um criador de enquetes ao sistema interno
 * Uso: node scripts/add-creator.js <MEMBER_ID>
 *
 * Exemplo:
 *   node scripts/add-creator.js 123456789012345678
 *   node scripts/add-creator.js <@123456789012345678>
 */

const fs = require('fs');
const path = require('path');

// Determina ambiente e paths
const APP_ENV = process.env.APP_ENV || 'prod';
const DATA_DIR = path.join(__dirname, '..', 'data', APP_ENV);
const CRIADORES_FILE = path.join(DATA_DIR, 'criadores-internos.json');

function loadCriadores() {
  try {
    if (fs.existsSync(CRIADORES_FILE)) {
      const raw = fs.readFileSync(CRIADORES_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Erro ao carregar criadores:', error.message);
  }
  return { criadores: [] };
}

function saveCriadores(data) {
  try {
    // Garante que o diretório existe
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CRIADORES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar criadores:', error.message);
    return false;
  }
}

function parseMemberId(input) {
  if (!input) return null;

  const match = String(input).match(/\d{15,20}/);
  return match ? match[0] : null;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Erro: ID do membro não fornecido\n');
    console.log('Uso: node scripts/add-creator.js <MEMBER_ID>\n');
    console.log('Exemplos:');
    console.log('  node scripts/add-creator.js 123456789012345678');
    console.log('  node scripts/add-creator.js "<@123456789012345678>"');
    console.log(`\nAmbiente: ${APP_ENV}`);
    console.log(`Arquivo: ${CRIADORES_FILE}`);
    process.exit(1);
  }

  const memberInput = args[0];
  const memberId = parseMemberId(memberInput);

  if (!memberId) {
    console.error('❌ Erro: ID inválido. Forneça um ID numérico válido (15-20 dígitos)');
    console.error(`   Recebido: "${memberInput}"`);
    process.exit(1);
  }

  try {
    const criadoresData = loadCriadores();
    const criadores = Array.isArray(criadoresData?.criadores) ? criadoresData.criadores : [];

    if (criadores.includes(memberId)) {
      console.log(`⚠️  Membro ${memberId} já possui privilégio de Criador de Enquetes`);
      console.log(`   Ambiente: ${APP_ENV}`);
      process.exit(0);
    }

    const nextData = {
      ...criadoresData,
      criadores: [...criadores, memberId],
    };

    const saved = saveCriadores(nextData);

    if (!saved) {
      console.error('❌ Erro ao salvar o arquivo criadores-internos.json');
      process.exit(1);
    }

    console.log('✅ Privilégio concedido com sucesso!');
    console.log(`   Membro ID: ${memberId}`);
    console.log(`   Ambiente: ${APP_ENV}`);
    console.log(`   Arquivo: ${CRIADORES_FILE}`);
    console.log(`   Total de criadores: ${nextData.criadores.length}`);
    console.log('\n✓ Mudanças aplicadas imediatamente. Não é necessário reiniciar o bot.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao processar operação:', error.message);
    process.exit(1);
  }
}

main();
