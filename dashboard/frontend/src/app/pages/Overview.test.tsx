import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Overview } from './Overview';
import { getGuilds, getPollHistory } from '../lib/dashboard-api';

jest.mock('../lib/dashboard-api', () => ({
  getGuilds: jest.fn(),
  getPollHistory: jest.fn(),
}));

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div />,
}));

const mockedGetGuilds = getGuilds as jest.MockedFunction<typeof getGuilds>;
const mockedGetPollHistory = getPollHistory as jest.MockedFunction<typeof getPollHistory>;

describe('Overview', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renderiza enquetes recentes como links para detalhes', async () => {
    mockedGetGuilds.mockResolvedValue([{ id: 'guild-1', name: 'Guild One', isActive: true }]);
    mockedGetPollHistory.mockResolvedValue([
      {
        id: 'poll-1',
        title: 'Enquete de livros',
        description: 'Escolha o próximo livro',
        serverId: 'guild-1',
        serverName: 'Guild One',
        channelId: 'channel-1',
        channelName: 'geral',
        createdAt: '2026-04-10T10:00:00Z',
        endsAt: '2099-04-10T10:00:00Z',
        durationKey: '24h',
        status: 'active',
        totalVotes: 5,
        options: [],
        allowMultipleChoices: false,
        anonymous: false,
      },
    ]);

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>,
    );

    const pollLink = await screen.findByRole('link', {
      name: 'Abrir detalhes da enquete Enquete de livros',
    });

    expect(pollLink).toHaveAttribute('href', '/poll/poll-1');
  });
});
