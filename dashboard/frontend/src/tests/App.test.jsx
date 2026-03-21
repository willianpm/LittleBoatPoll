import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

jest.mock('../api', () => ({
  getCurrentSession: jest.fn(),
  getGuilds: jest.fn(),
  getCommandCatalog: jest.fn(),
  getGuildChannels: jest.fn(),
  getPollContextTargets: jest.fn(),
  getGroupMembers: jest.fn(),
  getDraftContextTargets: jest.fn(),
  logoutSession: jest.fn(),
  uploadCsv: jest.fn(),
  executeCommand: jest.fn(),
  getGuildMembers: jest.fn(),
}));

const {
  getCurrentSession,
  getGuilds,
  getCommandCatalog,
  getGuildChannels,
  getPollContextTargets,
  getGroupMembers,
  getDraftContextTargets,
  uploadCsv,
} = jest.requireMock('../api');

beforeEach(() => {
  jest.clearAllMocks();
});

test('quando getCurrentSession falha, App exibe mensagem de não autenticado', async () => {
  // Arrange
  getCurrentSession.mockRejectedValue(new Error('Sessão não autenticada'));

  // Act
  render(<App />);

  // Assert
  expect(await screen.findByText(/Faça login para acessar o painel administrativo\./i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Entrar com Discord/i })).toBeInTheDocument();
  expect(screen.getByText(/Sessão não autenticada/i)).toBeInTheDocument();
});

test('quando uploadCsv é bem-sucedido, App mostra mensagem de sucesso', async () => {
  // Arrange
  getCurrentSession.mockResolvedValue({ user: { username: 'tester', guildId: 'guild-1' } });
  getGuilds.mockResolvedValue({ guilds: [{ id: 'guild-1', name: 'Guild 1', isActive: true }] });
  getCommandCatalog.mockResolvedValue({ commands: [] });
  getGuildChannels.mockResolvedValue({ channels: [] });
  getPollContextTargets.mockResolvedValue({ polls: [] });
  getGroupMembers.mockResolvedValue({ ids: [] });
  getDraftContextTargets.mockResolvedValue({ drafts: [] });
  uploadCsv.mockResolvedValue({ success: true });

  render(<App />);

  // Wait for app to finish loading and show logged-in header
  expect(await screen.findByText(/Logado como/i)).toBeInTheDocument();

  // Expand CSV upload panel
  const csvToggle = screen.getByRole('button', { name: /Upload CSV/i });
  await userEvent.click(csvToggle);

  // Attach file and submit
  const file = new File(['nome-da-enquete;opcoes;max_votos;peso_mensalistas\nExemplo;op1,op2;1;sim'], 'enquete.csv', {
    type: 'text/csv',
  });
  const fileInput = await screen.findByLabelText(/Arquivo CSV/i);
  await userEvent.upload(fileInput, file);

  const submitButton = await screen.findByRole('button', { name: /Enviar CSV/i });
  await userEvent.click(submitButton);

  // Assert
  expect(await screen.findByText(/Sucesso/i)).toBeInTheDocument();
  expect(uploadCsv).toHaveBeenCalledTimes(1);
});

test('quando uploadCsv falha, App mostra mensagem de erro', async () => {
  // Arrange
  getCurrentSession.mockResolvedValue({ user: { username: 'tester', guildId: 'guild-1' } });
  getGuilds.mockResolvedValue({ guilds: [{ id: 'guild-1', name: 'Guild 1', isActive: true }] });
  getCommandCatalog.mockResolvedValue({ commands: [] });
  getGuildChannels.mockResolvedValue({ channels: [] });
  getPollContextTargets.mockResolvedValue({ polls: [] });
  getGroupMembers.mockResolvedValue({ ids: [] });
  getDraftContextTargets.mockResolvedValue({ drafts: [] });
  uploadCsv.mockRejectedValue(new Error('Upload falhou'));

  render(<App />);

  expect(await screen.findByText(/Logado como/i)).toBeInTheDocument();

  const csvToggle = screen.getByRole('button', { name: /Upload CSV/i });
  await userEvent.click(csvToggle);

  const file = new File(['nome-da-enquete;opcoes;max_votos;peso_mensalistas\nExemplo;op1,op2;1;sim'], 'enquete.csv', {
    type: 'text/csv',
  });
  const fileInput = await screen.findByLabelText(/Arquivo CSV/i);
  await userEvent.upload(fileInput, file);

  const submitButton = await screen.findByRole('button', { name: /Enviar CSV/i });
  await userEvent.click(submitButton);

  expect(await screen.findByText(/Falhou/i)).toBeInTheDocument();
  expect(uploadCsv).toHaveBeenCalledTimes(1);
});
