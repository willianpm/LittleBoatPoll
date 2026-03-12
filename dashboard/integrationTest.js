// Script de integração simples para backend do Dashboard
// Permite alternar entre mocks e serviços reais

const useMock = process.env.USE_MOCK === 'true';
const csvService = useMock ? require('./services/csvService.mock') : require('./services/csvService');
const botService = useMock ? require('./services/botService.mock') : require('./services/botService');

(async () => {
  // Simule o caminho de um arquivo CSV real ou fictício
  const csvPath = useMock ? 'mock.csv' : './services/test.csv';
  const result = await csvService.parseAndValidate(csvPath);
  const { validatePollOptions, parseOptions } = require('../src/utils/validators');
  let sucesso = 0;
  let falhas = [];
  let criadas = [];
  if (result.valid && Array.isArray(result.data)) {
    for (let i = 0; i < result.data.length; i++) {
      const linha = result.data[i];
      // Aceita tanto 'opcoes' quanto 'opções' (com acento)
      const opcoesRaw = linha.opcoes || linha['opções'];
      const opcoes = Array.isArray(opcoesRaw)
        ? opcoesRaw
        : parseOptions(Array.isArray(opcoesRaw) ? opcoesRaw.join(',') : opcoesRaw);
      const maxVotos = linha.maxVotos || linha['max_votos'];
      const validation = validatePollOptions(opcoes, maxVotos);
      if (!validation.valid) {
        falhas.push({ linha: i + 2, motivo: validation.error });
        continue;
      }
      // Monta DTO conforme estrutura interna
      const dto = {
        titulo: linha.titulo || linha['nome-da-enquete'],
        opcoes,
        maxVotos: linha.maxVotos,
        usarPesoMensalista: linha.usarPesoMensalista,
        status: 'rascunho',
        criadoEm: linha.criadoEm || new Date().toISOString(),
        editadoEm: linha.editadoEm || new Date().toISOString(),
      };
      criadas.push(dto);
      sucesso++;
    }
    // Salva apenas as enquetes válidas
    if (criadas.length) {
      await botService.savePoll(criadas);
    }
    // Feedback detalhado
    console.log(`Enquetes criadas com sucesso: ${sucesso}`);
    if (falhas.length) {
      console.log('Falhas:');
      falhas.forEach((f) => console.log(`Linha ${f.linha}: ${f.motivo}`));
    }
  } else {
    console.error('Erro:', result.error);
  }
})();
