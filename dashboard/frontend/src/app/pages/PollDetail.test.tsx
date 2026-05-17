import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { PollDetail } from './PollDetail';

jest.mock('../lib/dashboard-api', () => ({
  getPollDetail: jest.fn(),
}));

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div />,
}));

jest.mock('react-router', () => ({
  useParams: () => ({ id: 'poll-1' }),
  Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { getPollDetail } = require('../lib/dashboard-api');

describe('PollDetail', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders Participation and Voting groups with computed values', async () => {
    getPollDetail.mockResolvedValue({
      id: 'poll-1',
      title: 'Test Poll',
      description: 'desc',
      serverId: 'guild-1',
      serverName: 'Guild',
      channelId: 'channel-1',
      channelName: 'geral',
      createdAt: '2026-01-01T00:00:00Z',
      endsAt: null,
      durationKey: '24h',
      status: 'ended',
      totalVotes: 4,
      options: [],
      allowMultipleChoices: false,
      anonymous: false,
      participants: [
        { userId: 'u1', username: 'u1', displayName: 'U1', isMensalista: true, choices: ['A'] },
        { userId: 'u2', username: 'u2', displayName: 'U2', isMensalista: false, choices: ['B', 'C'] },
      ],
      totalParticipants: 2,
      totalMensalistas: 1,
    });

    render(<PollDetail />);

    // ensure component called API with route id
    expect(getPollDetail).toHaveBeenCalledWith('poll-1');

    expect(await screen.findByText('Participação')).toBeInTheDocument();
    const participantsContainer = screen.getByText('Participantes únicos').closest('div');
    expect(within(participantsContainer as HTMLElement).getByText('2')).toBeInTheDocument();

    const mensalistasContainer = screen.getByText('Mensalistas participantes').closest('div');
    expect(within(mensalistasContainer as HTMLElement).getByText('1')).toBeInTheDocument();

    expect(screen.getByText('Votação')).toBeInTheDocument();
    const registradosContainer = screen.getByText('Votos registrados').closest('div');
    // registered votes = 1 + 2 = 3
    expect(within(registradosContainer as HTMLElement).getByText('3')).toBeInTheDocument();

    const ponderadosContainer = screen.getByText('Votos ponderados').closest('div');
    expect(within(ponderadosContainer as HTMLElement).getByText('4')).toBeInTheDocument();

    expect(await screen.findByText('Participantes (2)')).toBeInTheDocument();
    expect(screen.queryByText('Anônimo')).not.toBeInTheDocument();

    expect(screen.queryByText('Comparação de Votos')).not.toBeInTheDocument();
  });
});
