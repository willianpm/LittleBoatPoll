import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreatePoll } from './CreatePoll';
import { createDraft, getGuildChannels, getGuildEmojis, getGuilds } from '../lib/dashboard-api';

jest.mock('../lib/dashboard-api', () => ({
  createDraft: jest.fn(),
  getGuildChannels: jest.fn(),
  getGuildEmojis: jest.fn(),
  getGuilds: jest.fn(),
}));

jest.mock('../components/ui/select', () => {
  const React = require('react');

  function getTextContent(node: any): string {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node);
    }

    if (Array.isArray(node)) {
      return node.map((child) => getTextContent(child)).join('');
    }

    if (React.isValidElement(node)) {
      return getTextContent(node.props?.children);
    }

    return '';
  }

  const SelectContext = React.createContext({
    value: '',
    onValueChange: null,
    disabled: false,
  });

  function Select({ value, onValueChange, disabled, children }: any) {
    return React.createElement(
      SelectContext.Provider,
      { value: { value, onValueChange, disabled: Boolean(disabled) } },
      children,
    );
  }

  function SelectTrigger() {
    return null;
  }

  function SelectValue() {
    return null;
  }

  function SelectContent({ children }: any) {
    const context = React.useContext(SelectContext);
    return React.createElement(
      'select',
      {
        value: context.value || '',
        disabled: context.disabled,
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) => context.onValueChange?.(event.target.value),
      },
      children,
    );
  }

  function SelectItem({ value, children }: any) {
    return React.createElement('option', { value }, getTextContent(children));
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('emoji-picker-react', () => {
  const React = require('react');
  function EmojiPicker() {
    return React.createElement('div', { 'data-testid': 'emoji-picker-mock' });
  }

  return {
    __esModule: true,
    default: EmojiPicker,
    Theme: {
      DARK: 'dark',
    },
  };
});

const mockedGetGuilds = getGuilds as jest.MockedFunction<typeof getGuilds>;
const mockedGetGuildChannels = getGuildChannels as jest.MockedFunction<typeof getGuildChannels>;
const mockedGetGuildEmojis = getGuildEmojis as jest.MockedFunction<typeof getGuildEmojis>;
const mockedCreateDraft = createDraft as jest.MockedFunction<typeof createDraft>;

describe('CreatePoll', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedGetGuilds.mockResolvedValue([
      {
        id: 'guild-1',
        name: 'Guild One',
        isActive: true,
        emojis: [{ id: 'emoji-1', name: 'livro', animated: false, identifier: '<:livro:123456789012345678>' }],
      },
    ]);
    mockedGetGuildChannels.mockResolvedValue([{ id: 'channel-1', name: 'geral', type: 0 }]);
    mockedGetGuildEmojis.mockResolvedValue([
      { id: 'emoji-1', name: 'livro', animated: false, identifier: '<:livro:123456789012345678>' },
    ]);
    mockedCreateDraft.mockResolvedValue({ success: true, message: 'ok' });
  });

  const selectChannel = async () => {
    const selects = await screen.findAllByRole('combobox');
    const channelSelect = selects.find((element) =>
      Array.from(element.querySelectorAll('option')).some((option) => option.textContent?.includes('# geral')),
    );

    expect(channelSelect).toBeTruthy();
    fireEvent.change(channelSelect as HTMLSelectElement, { target: { value: 'channel-1' } });
  };

  const selectEmojiForOption = async (optionIndex: number, identifier: string) => {
    const serverEmojiSelects = (await screen.findAllByRole('combobox')).filter((element) =>
      Array.from(element.querySelectorAll('option')).some((option) => option.value === identifier),
    );

    expect(serverEmojiSelects.length).toBeGreaterThan(optionIndex);
    fireEvent.change(serverEmojiSelects[optionIndex] as HTMLSelectElement, {
      target: { value: identifier },
    });
  };

  it('envia rascunho com pelo menos 2 opções válidas incluindo emoji unicode e customizado', async () => {
    render(<CreatePoll />);

    await waitFor(() => {
      expect(mockedGetGuilds).toHaveBeenCalled();
      expect(mockedGetGuildChannels).toHaveBeenCalledWith('guild-1');
      expect(mockedGetGuildEmojis).toHaveBeenCalledWith('guild-1');
    });

    await selectChannel();

    fireEvent.change(screen.getByLabelText('Título da Enquete *'), {
      target: { value: 'Nova enquete' },
    });

    await selectEmojiForOption(0, '<:livro:123456789012345678>');
    fireEvent.change(screen.getByPlaceholderText('Opção 1'), {
      target: { value: 'Opção A' },
    });

    await selectEmojiForOption(1, '<:livro:123456789012345678>');
    fireEvent.change(screen.getByPlaceholderText('Opção 2'), {
      target: { value: 'Opção B' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Enquete' }));

    await waitFor(() => {
      expect(mockedCreateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nova enquete',
          options: [
            { text: 'Opção A', emoji: '<:livro:123456789012345678>' },
            { text: 'Opção B', emoji: '<:livro:123456789012345678>' },
          ],
        }),
      );
    });
  });

  it('rejeita envio quando faltar seleção de emoji', async () => {
    render(<CreatePoll />);

    await waitFor(() => {
      expect(mockedGetGuildChannels).toHaveBeenCalledWith('guild-1');
      expect(mockedGetGuildEmojis).toHaveBeenCalledWith('guild-1');
    });

    await selectChannel();

    fireEvent.change(screen.getByLabelText('Título da Enquete *'), {
      target: { value: 'Nova enquete' },
    });

    fireEvent.change(screen.getByPlaceholderText('Opção 1'), {
      target: { value: 'Opção A' },
    });

    await selectEmojiForOption(1, '<:livro:123456789012345678>');
    fireEvent.change(screen.getByPlaceholderText('Opção 2'), {
      target: { value: 'Opção B' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Enquete' }));

    await waitFor(() => {
      expect(mockedCreateDraft).not.toHaveBeenCalled();
    });
  });
});
