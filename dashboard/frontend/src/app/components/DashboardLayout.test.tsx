import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DashboardLayout } from './DashboardLayout';
import { useTheme } from 'next-themes';
import { useAuth } from '../context/AuthContext';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseTheme = jest.mocked(useTheme);
const mockedUseAuth = jest.mocked(useAuth);

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<div>Conteudo</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardLayout theme toggle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    document.documentElement.classList.remove('dark');

    mockedUseAuth.mockReturnValue({
      user: { id: '1', username: 'tester', guildId: 'guild-1' },
      isAuthenticated: true,
      isLoading: false,
      login: () => {},
      logout: async () => {},
      refreshAuth: async () => true,
    });
  });

  it('alterna no primeiro clique mesmo com tema indefinido', () => {
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue({
      theme: undefined,
      resolvedTheme: undefined,
      setTheme,
      themes: ['light', 'dark'],
      systemTheme: undefined,
      forcedTheme: undefined,
    });

    renderLayout();

    fireEvent.click(screen.getAllByLabelText('Alternar tema')[0]);

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('alterna de dark para light', () => {
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme,
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    });

    renderLayout();

    fireEvent.click(screen.getAllByLabelText('Alternar tema')[0]);

    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('alterna de light para dark', () => {
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme,
      themes: ['light', 'dark'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    renderLayout();

    fireEvent.click(screen.getAllByLabelText('Alternar tema')[0]);

    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
