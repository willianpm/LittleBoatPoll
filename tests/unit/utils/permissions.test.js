jest.mock('../../../src/utils/file-handler', () => ({
  loadCriadores: jest.fn(),
  loadRoleBindings: jest.fn(),
}));

const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { loadCriadores, loadRoleBindings } = require('../../../src/utils/file-handler');
const { isCriador, MENSAGEM_PERMISSAO_NEGADA, checkPermissionReply } = require('../../../src/utils/permissions');

function createMember({
  memberId = 'member-1',
  ownerId = 'owner-1',
  guildId = 'guild-1',
  isAdmin = false,
  roleIds = [],
} = {}) {
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
    loadRoleBindings.mockReturnValue({ mensalistaRoleByGuild: {} });
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

  test('deve retornar false para usuário sem regras de acesso', () => {
    const member = createMember({ memberId: 'common-user', roleIds: ['role-comum'] });
    expect(isCriador(member)).toBe(false);
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
});

describe('permissions - checkPermissionReply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadCriadores.mockReturnValue({ criadores: [] });
    loadRoleBindings.mockReturnValue({ mensalistaRoleByGuild: {} });
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
    loadCriadores.mockReturnValue({ criadores: ['member-1'] });

    const interaction = { reply: jest.fn(async () => null) };
    const member = createMember({ memberId: 'member-1' });

    const result = await checkPermissionReply(interaction, member);

    expect(result).toBe(true);
    expect(interaction.reply).not.toHaveBeenCalled();
  });
});
