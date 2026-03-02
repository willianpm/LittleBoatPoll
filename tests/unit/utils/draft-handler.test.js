const { getUserDrafts, getLatestUserDraft, getDraftById, canEditDraft } = require('../../../src/utils/draft-handler');

describe('draft-handler - getUserDrafts', () => {
  test('deve retornar rascunhos do usuário ordenados por data de edição', () => {
    const draftPolls = new Map([
      [
        'draft1',
        { draftId: 'draft1', criadorId: 'user1', criadoEm: new Date('2026-01-01'), editadoEm: new Date('2026-01-03') },
      ],
      [
        'draft2',
        { draftId: 'draft2', criadorId: 'user1', criadoEm: new Date('2026-01-02'), editadoEm: new Date('2026-01-04') },
      ],
      ['draft3', { draftId: 'draft3', criadorId: 'user2', criadoEm: new Date('2026-01-03') }],
    ]);

    const result = getUserDrafts(draftPolls, 'user1');

    expect(result).toHaveLength(2);
    expect(result[0].draftId).toBe('draft2'); // mais recente (editado em 2026-01-04)
    expect(result[1].draftId).toBe('draft1'); // segundo mais recente
  });

  test('deve ordenar por criadoEm se editadoEm não existir', () => {
    const draftPolls = new Map([
      ['draft1', { draftId: 'draft1', criadorId: 'user1', criadoEm: new Date('2026-01-01') }],
      ['draft2', { draftId: 'draft2', criadorId: 'user1', criadoEm: new Date('2026-01-05') }],
    ]);

    const result = getUserDrafts(draftPolls, 'user1');

    expect(result[0].draftId).toBe('draft2'); // mais recente
    expect(result[1].draftId).toBe('draft1');
  });

  test('deve retornar array vazio se usuário não tiver rascunhos', () => {
    const draftPolls = new Map([['draft1', { draftId: 'draft1', criadorId: 'user1' }]]);

    const result = getUserDrafts(draftPolls, 'user2');
    expect(result).toEqual([]);
  });

  test('deve retornar array vazio se draftPolls estiver vazio', () => {
    const draftPolls = new Map();
    const result = getUserDrafts(draftPolls, 'user1');
    expect(result).toEqual([]);
  });
});

describe('draft-handler - getLatestUserDraft', () => {
  test('deve retornar o rascunho mais recente do usuário', () => {
    const draftPolls = new Map([
      ['draft1', { draftId: 'draft1', criadorId: 'user1', criadoEm: new Date('2026-01-01') }],
      ['draft2', { draftId: 'draft2', criadorId: 'user1', criadoEm: new Date('2026-01-05') }],
    ]);

    const result = getLatestUserDraft(draftPolls, 'user1');
    expect(result.draftId).toBe('draft2');
  });

  test('deve retornar null se usuário não tiver rascunhos', () => {
    const draftPolls = new Map([['draft1', { draftId: 'draft1', criadorId: 'user1' }]]);

    const result = getLatestUserDraft(draftPolls, 'user2');
    expect(result).toBeNull();
  });

  test('deve retornar null se draftPolls estiver vazio', () => {
    const draftPolls = new Map();
    const result = getLatestUserDraft(draftPolls, 'user1');
    expect(result).toBeNull();
  });

  test('deve retornar único rascunho do usuário', () => {
    const draftPolls = new Map([['draft1', { draftId: 'draft1', criadorId: 'user1', titulo: 'Único Rascunho' }]]);

    const result = getLatestUserDraft(draftPolls, 'user1');
    expect(result.draftId).toBe('draft1');
    expect(result.titulo).toBe('Único Rascunho');
  });
});

describe('draft-handler - getDraftById', () => {
  test('deve retornar rascunho existente pelo ID', () => {
    const draftPolls = new Map([
      ['draft1', { draftId: 'draft1', titulo: 'Rascunho 1' }],
      ['draft2', { draftId: 'draft2', titulo: 'Rascunho 2' }],
    ]);

    const result = getDraftById(draftPolls, 'draft1');
    expect(result).not.toBeNull();
    expect(result.draftId).toBe('draft1');
    expect(result.titulo).toBe('Rascunho 1');
  });

  test('deve retornar null para ID inexistente', () => {
    const draftPolls = new Map([['draft1', { draftId: 'draft1' }]]);

    const result = getDraftById(draftPolls, 'nonexistent');
    expect(result).toBeNull();
  });

  test('deve retornar null se draftPolls estiver vazio', () => {
    const draftPolls = new Map();
    const result = getDraftById(draftPolls, 'draft1');
    expect(result).toBeNull();
  });
});

describe('draft-handler - canEditDraft', () => {
  test('deve permitir criador do rascunho editar', () => {
    const result = canEditDraft('user1', 'user1', false);
    expect(result).toBe(true);
  });

  test('deve permitir usuário com cargo Criador editar qualquer rascunho', () => {
    const result = canEditDraft('user1', 'user2', true);
    expect(result).toBe(true);
  });

  test('deve permitir criador original mesmo sendo Criador', () => {
    const result = canEditDraft('user1', 'user1', true);
    expect(result).toBe(true);
  });

  test('deve negar usuário sem permissão', () => {
    const result = canEditDraft('user1', 'user2', false);
    expect(result).toBe(false);
  });

  test('deve negar usuário diferente sem cargo Criador', () => {
    const result = canEditDraft('user1', 'user3', false);
    expect(result).toBe(false);
  });
});
