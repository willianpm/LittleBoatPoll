require('dotenv').config();

/**
 * =====================================
 * DEPLOY DE COMANDOS DISCORD (LEGADO)
 * =====================================
 *
 * Este arquivo foi movido para dentro de index.js
 * A funcionalidade agora está integrada no arquivo principal
 *
 * Como usar:
 * node index.js --deploy
 * ou
 * npm run deploy
 */

console.log('ℹ️ Deploy de comandos foi integrado ao index.js');
console.log('Execute: node index.js --deploy');
console.log('ou');
console.log('Execute: npm run deploy\n');

// Chama o índice com a flag de deploy
require('child_process').spawnSync('node', ['index.js', '--deploy'], { stdio: 'inherit' });
