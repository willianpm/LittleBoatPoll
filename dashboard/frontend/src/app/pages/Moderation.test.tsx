import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Moderation } from './Moderation';
import {
  addModerator,
  addSubscriber,
  getGroupMembers,
  getGuildMembers,
  getGuilds,
  removeModerator,
  removeSubscriber,
} from '../lib/dashboard-api';

jest.mock('../lib/dashboard-api', () => ({
  addModerator: jest.fn(),
  addSubscriber: jest.fn(),
  getGroupMembers: jest.fn(),
  getGuildMembers: jest.fn(),
  getGuilds: jest.fn(),
  removeModerator: jest.fn(),
  removeSubscriber: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockedGetGuilds = getGuilds as jest.MockedFunction<typeof getGuilds>;
const mockedGetGuildMembers = getGuildMembers as jest.MockedFunction<typeof getGuildMembers>;
const mockedGetGroupMembers = getGroupMembers as jest.MockedFunction<typeof getGroupMembers>;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('Moderation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (addModerator as jest.Mock).mockResolvedValue({ success: true });
    (addSubscriber as jest.Mock).mockResolvedValue({ success: true });
    (removeModerator as jest.Mock).mockResolvedValue({ success: true });
    (removeSubscriber as jest.Mock).mockResolvedValue({ success: true });
  });

  it('shows loading skeleton before moderation data is ready', async () => {
    const guildDeferred = createDeferred([{ id: 'guild-1', name: 'Guild One', isActive: true }]);

    mockedGetGuilds.mockReturnValueOnce(guildDeferred.promise);
    mockedGetGuildMembers.mockResolvedValue([]);
    mockedGetGroupMembers.mockResolvedValue([]);

    const { container } = render(<Moderation />);

    expect(screen.queryByText('Lista de Moderadores')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    guildDeferred.resolve([{ id: 'guild-1', name: 'Guild One', isActive: true }]);

    await screen.findByText('Lista de Moderadores');
  });

  it('renders authorship metadata with display name and id fallback', async () => {
    mockedGetGuilds.mockResolvedValue([{ id: 'guild-1', name: 'Guild One', isActive: true }]);
    mockedGetGuildMembers.mockResolvedValue([
      { id: 'mod-1', username: 'mod1', displayName: 'Moderador 1' },
      { id: 'mod-2', username: 'mod2', displayName: 'Moderador 2' },
      { id: 'admin-1', username: 'admin1', displayName: 'Administrador' },
      { id: 'sub-1', username: 'sub1', displayName: 'Mensalista 1' },
    ]);

    mockedGetGroupMembers.mockImplementation(async (_guildId, group) => {
      if (group === 'criadores') {
        return [
          {
            id: 'mod-1',
            addedAt: '2026-04-08T12:30:00.000Z',
            addedBy: 'admin-1',
          },
          {
            id: 'mod-2',
            addedAt: '2026-04-08T13:00:00.000Z',
            addedBy: 'unknown-admin',
          },
        ];
      }

      return [];
    });

    render(<Moderation />);

    const guildSelect = await screen.findByLabelText('Servidor');
    fireEvent.change(guildSelect, { target: { value: 'guild-1' } });

    await screen.findByText('Lista de Moderadores');
    expect(screen.getByText(/Adicionado por Administrador em/i)).toBeInTheDocument();
    expect(screen.getByText(/Adicionado por unknown-admin em/i)).toBeInTheDocument();
  });
});
