jest.mock('../utils/file-handler', () => ({
  loadCriadores: jest.fn(),
  loadRoleBindings: jest.fn(),
}));

const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { loadCriadores, loadRoleBindings } = require('../utils/file-handler');
const { isCriador, hasAuthorizedAdminRole, getAuthorizedAdminRoleIds, MENSAGEM_PERMISSAO_NEGADA, checkPermissionReply } = require('../utils/permissions');

function createMember({ memberId = 'member-1', ownerId = 'owner-1', guildId = 'guild-1', isAdmin = false, roleIds = [] } = {}) {
  const roleCache = new Map(roleIds.map((roleId) => [roleId, { id: roleId }]));

  return {
    id: memberId,
    guild: { id: guildId, ownerId },
    permissions: {
      has: jest.fn((permission) => permission === PermissionFlagsBits.Administrator && isAdmin),
    },
    roles: {
      cache: roleCache,
    },
  };
}

describe('permissions - authorization checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadCriadores.mockReturnValue({ criadores: [] });
    loadRoleBindings.mockReturnValue({ mensalistaRoleByGuild: {}, adminRoleIdsByGuild: {} });
  });

  test('deve retornar true para administrador', () => {
    const member = createMember({ isAdmin: true });
    expect(isCriador(member)).toBe(true);
  });

  test('deve retornar true para dono do servidor', () => {
    const member = createMember({ memberId: 'owner-1', ownerId: 'owner-1' });
    expect(isCriador(member)).toBe(true);
  });

  test('deve retornar true para criador interno cadastrado por ID', () => {
    loadCriadores.mockReturnValue({ criadores: ['member-1'] });

    const member = createMember({ memberId: 'member-1' });
    expect(isCriador(member)).toBe(true);
  });

  test('deve retornar true para membro com cargo administrativo autorizado', () => {
    loadRoleBindings.mockReturnValue({
      mensalistaRoleByGuild: {},
      adminRoleIdsByGuild: { 'guild-1': ['role-admin', 'role-moderacao'] },
    });

    const member = createMember({ roleIds: ['role-admin'] });
    expect(isCriador(member)).toBe(true);
  });

  test('deve retornar false para usuário sem regras de acesso', () => {
    const member = createMember({ memberId: 'common-user', roleIds: ['role-comum'] });
    expect(isCriador(member)).toBe(false);
  });

  test('deve retornar true para membro em formato APIInteractionGuildMember com cargo autorizado', () => {
    loadRoleBindings.mockReturnValue({
      mensalistaRoleByGuild: {},
      adminRoleIdsByGuild: { '771368260633362473': ['1325882022522130606'] },
    });

    const apiMember = {
      user: { id: 'member-1' },
      guild: { id: '771368260633362473', ownerId: 'owner-1' },
      permissions: '0',
      roles: ['1325882022522130606'],
    };

    expect(isCriador(apiMember)).toBe(true);
  });

  test('deve reconhecer admin via bitfield string no formato APIInteractionGuildMember', () => {
    const apiMember = {
      user: { id: 'member-1' },
      guild: { id: 'guild-1', ownerId: 'owner-1' },
      permissions: PermissionFlagsBits.Administrator.toString(),
      roles: [],
    };

    expect(isCriador(apiMember)).toBe(true);
  });

  test('deve autorizar cargo para APIInteractionGuildMember sem guild quando guildId é informado', () => {
    loadRoleBindings.mockReturnValue({
      mensalistaRoleByGuild: {},
      adminRoleIdsByGuild: { '771368260633362473': ['1325882022522130606'] },
    });

    const apiMemberSemGuild = {
      user: { id: 'member-1' },
      permissions: '0',
      roles: ['1325882022522130606'],
    };

    expect(hasAuthorizedAdminRole(apiMemberSemGuild, '771368260633362473')).toBe(true);
    expect(isCriador(apiMemberSemGuild, '771368260633362473')).toBe(true);
  });

  test('getAuthorizedAdminRoleIds deve retornar lista vazia sem guildId', () => {
    expect(getAuthorizedAdminRoleIds()).toEqual([]);
  });

  test('hasAuthorizedAdminRole deve retornar false quando membro não possui cache de cargos', () => {
    loadRoleBindings.mockReturnValue({
      mensalistaRoleByGuild: {},
      adminRoleIdsByGuild: { 'guild-1': ['role-admin'] },
    });

    const member = {
      guild: { id: 'guild-1' },
      roles: {},
    };

    expect(hasAuthorizedAdminRole(member)).toBe(false);
  });
});

describe('permissions - checkPermissionReply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadCriadores.mockReturnValue({ criadores: [] });
    loadRoleBindings.mockReturnValue({ mensalistaRoleByGuild: {}, adminRoleIdsByGuild: {} });
  });

  test('deve responder com erro quando usuário não tem permissão', async () => {
    const interaction = { reply: jest.fn(async () => null) };
    const member = createMember({ memberId: 'common-user' });

    const result = await checkPermissionReply(interaction, member);

    expect(result).toBe(false);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: MENSAGEM_PERMISSAO_NEGADA,
      flags: MessageFlags.Ephemeral,
    });
  });

  test('deve retornar true sem responder quando usuário tem permissão', async () => {
    loadRoleBindings.mockReturnValue({
      mensalistaRoleByGuild: {},
      adminRoleIdsByGuild: { 'guild-1': ['role-admin'] },
    });

    const interaction = { reply: jest.fn(async () => null) };
    const member = createMember({ roleIds: ['role-admin'] });

    const result = await checkPermissionReply(interaction, member);

    expect(result).toBe(true);
    expect(interaction.reply).not.toHaveBeenCalled();
  });
});
