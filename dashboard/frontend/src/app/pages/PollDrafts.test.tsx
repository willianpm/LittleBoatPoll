import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PollDrafts } from './PollDrafts';
import {
  deleteDraft,
  editDraft,
  getDraftContextTargets,
  getGuildEmojis,
  getGuilds,
  publishDraft,
} from '../lib/dashboard-api';

jest.mock('react-router', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../lib/dashboard-api', () => ({
  deleteDraft: jest.fn(),
  editDraft: jest.fn(),
  getDraftContextTargets: jest.fn(),
  getGuildEmojis: jest.fn(),
  getGuilds: jest.fn(),
  publishDraft: jest.fn(),
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
  function EmojiPicker({ onEmojiClick, customEmojis = [] }: any) {
    const triggerEmoji = (emoji: string, isCustom = false) => {
      onEmojiClick?.(
        {
          activeSkinTone: 'neutral',
          unified: emoji,
          unifiedWithoutSkinTone: emoji,
          emoji,
          names: [emoji],
          imageUrl: '',
          getImageUrl: () => '',
          isCustom,
        },
        {},
      );
    };

    return React.createElement(
      'div',
      { 'data-testid': 'emoji-picker-mock' },
      React.createElement('button', { type: 'button', onClick: () => triggerEmoji('😀', false) }, '😀'),
      ...customEmojis.map((emoji: any) =>
        React.createElement(
          'button',
          { type: 'button', key: emoji.id, onClick: () => triggerEmoji(emoji.id, true) },
          emoji.id,
        ),
      ),
    );
  }

  return {
    __esModule: true,
    default: EmojiPicker,
    EmojiStyle: {
      NATIVE: 'native',
      TWITTER: 'twitter',
    },
    Theme: {
      AUTO: 'auto',
      LIGHT: 'light',
      DARK: 'dark',
    },
  };
});

const mockedGetDraftContextTargets = getDraftContextTargets as jest.MockedFunction<typeof getDraftContextTargets>;
const mockedGetGuilds = getGuilds as jest.MockedFunction<typeof getGuilds>;
const mockedGetGuildEmojis = getGuildEmojis as jest.MockedFunction<typeof getGuildEmojis>;
const mockedEditDraft = editDraft as jest.MockedFunction<typeof editDraft>;

describe('PollDrafts', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    (deleteDraft as jest.MockedFunction<typeof deleteDraft>).mockResolvedValue({ success: true });
    (publishDraft as jest.MockedFunction<typeof publishDraft>).mockResolvedValue({ success: true });

    mockedGetGuilds.mockResolvedValue([
      {
        id: 'guild-1',
        name: 'Guild One',
        isActive: true,
        emojis: [{ id: 'emoji-1', name: 'livro', animated: false, identifier: '<:livro:123456789012345678>' }],
      },
    ]);

    mockedGetGuildEmojis.mockResolvedValue([
      { id: 'emoji-1', name: 'livro', animated: false, identifier: '<:livro:123456789012345678>' },
    ]);

    mockedGetDraftContextTargets.mockResolvedValue([
      {
        id: 'draft-1',
        title: 'Enquete do mês',
        guildId: 'guild-1',
        channelId: 'channel-1',
        serverName: 'Guild One',
        channelName: 'geral',
        optionsCount: 2,
        options: [
          { text: 'Opção A', emoji: '<:livro:123456789012345678>' },
          { text: 'Opção B', emoji: '😀' },
        ],
        updatedAt: '2026-04-21T10:00:00.000Z',
      },
    ]);

    mockedEditDraft.mockResolvedValue({ success: true, message: 'ok' });
  });

  it('carrega emojis customizados e padrão ao editar rascunho', async () => {
    render(<PollDrafts />);

    const editButton = await screen.findByRole('button', { name: 'Editar' });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockedGetGuildEmojis).toHaveBeenCalledWith('guild-1');
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Selecionar emoji da opção 1' }));

    expect(await screen.findByRole('button', { name: '<:livro:123456789012345678>' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '😀' })).toBeInTheDocument();
  });

  it('renderiza emojis padrão sem duplicar o glyph no item do seletor', async () => {
    render(<PollDrafts />);

    const editButton = await screen.findByRole('button', { name: 'Editar' });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockedGetGuildEmojis).toHaveBeenCalledWith('guild-1');
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Selecionar emoji da opção 1' }));

    expect(await screen.findByRole('button', { name: '😀' })).toBeInTheDocument();
  });

  it('preserva emojis selecionados de origens diferentes ao salvar edição', async () => {
    render(<PollDrafts />);

    const editButton = await screen.findByRole('button', { name: 'Editar' });
    fireEvent.click(editButton);

    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(mockedEditDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'draft-1',
          options: [
            { text: 'Opção A', emoji: '<:livro:123456789012345678>' },
            { text: 'Opção B', emoji: '😀' },
          ],
        }),
      );
    });
  });
});
