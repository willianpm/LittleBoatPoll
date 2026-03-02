jest.mock('../utils/file-handler', () => ({
  loadRoleBindings: jest.fn(),
  saveRoleBindings: jest.fn(),
}));

const { loadRoleBindings, saveRoleBindings } = require('../utils/file-handler');
const { findMensalistasRoleByName, ensureMensalistaRoleBinding } = require('../utils/mensalista-binding');

function createGuild({ id = 'guild-1', name = 'Guild Test', roles = [] } = {}) {
  const rolesCache = new Map(roles.map((role) => [role.id, role]));
  rolesCache.find = function findRole(predicate) {
    for (const role of this.values()) {
      if (predicate(role)) return role;
    }
    return undefined;
  };

  return {
    id,
    name,
    roles: {
      cache: rolesCache,
      fetch: jest.fn(async (roleId) => {
        if (roleId) {
          return rolesCache.get(roleId) || null;
        }
        return rolesCache;
      }),
    },
  };
}

describe('mensalista-binding - findMensalistasRoleByName', () => {
  test('deve encontrar cargo Mensalistas por nome (case-insensitive)', () => {
    const guild = createGuild({
      roles: [
        { id: '1', name: 'Moderadores' },
        { id: '2', name: 'MeNsAliStAs' },
      ],
    });

    const role = findMensalistasRoleByName(guild);
    expect(role).toBeTruthy();
    expect(role.id).toBe('2');
  });

  test('deve retornar null quando cargo não existir', () => {
    const guild = createGuild({ roles: [{ id: '1', name: 'Visitantes' }] });
    expect(findMensalistasRoleByName(guild)).toBeNull();
  });
});

describe('mensalista-binding - ensureMensalistaRoleBinding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve reaproveitar binding persistido quando role ainda existe', async () => {
    loadRoleBindings.mockReturnValue({
      mensalistaRoleByGuild: { 'guild-1': 'role-2' },
    });

    const guild = createGuild({
      id: 'guild-1',
      roles: [
        { id: 'role-2', name: 'Mensalistas' },
        { id: 'role-3', name: 'Outro' },
      ],
    });

    const roleId = await ensureMensalistaRoleBinding(guild);

    expect(roleId).toBe('role-2');
    expect(saveRoleBindings).not.toHaveBeenCalled();
  });

  test('deve persistir binding novo quando encontra cargo por nome', async () => {
    loadRoleBindings.mockReturnValue({ mensalistaRoleByGuild: {} });

    const guild = createGuild({
      id: 'guild-1',
      roles: [{ id: 'role-2', name: 'Mensalistas' }],
    });

    const roleId = await ensureMensalistaRoleBinding(guild);

    expect(roleId).toBe('role-2');
    expect(saveRoleBindings).toHaveBeenCalledWith({
      mensalistaRoleByGuild: { 'guild-1': 'role-2' },
    });
  });

  test('deve limpar binding inválido quando cargo não existe mais', async () => {
    loadRoleBindings.mockReturnValue({
      mensalistaRoleByGuild: { 'guild-1': 'role-antigo' },
    });

    const guild = createGuild({
      id: 'guild-1',
      roles: [{ id: 'role-3', name: 'Visitantes' }],
    });

    const roleId = await ensureMensalistaRoleBinding(guild);

    expect(roleId).toBeNull();
    expect(saveRoleBindings).toHaveBeenCalledWith({ mensalistaRoleByGuild: {} });
  });

  test('deve manter fallback sem erro quando cargo Mensalistas não existe', async () => {
    loadRoleBindings.mockReturnValue({ mensalistaRoleByGuild: {} });

    const guild = createGuild({
      id: 'guild-1',
      roles: [{ id: 'role-3', name: 'Visitantes' }],
    });

    const roleId = await ensureMensalistaRoleBinding(guild);

    expect(roleId).toBeNull();
    expect(saveRoleBindings).not.toHaveBeenCalled();
  });
});
