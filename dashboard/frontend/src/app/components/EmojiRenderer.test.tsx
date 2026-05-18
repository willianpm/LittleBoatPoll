import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EmojiRenderer from './EmojiRenderer';

const originalUserAgent = window.navigator.userAgent;

function setUserAgent(value: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value,
    configurable: true,
  });
}

describe('EmojiRenderer', () => {
  afterEach(() => {
    setUserAgent(originalUserAgent);
  });

  it('falls back to a safe placeholder when the emoji asset fails to load', async () => {
    render(<EmojiRenderer emojiId="123456789012345678" emojiAnimated={false} alt="Emoji de teste" />);

    const image = screen.getByRole('img', { name: 'Emoji de teste' });
    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'Emoji de teste' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Emoji de teste')).toBeInTheDocument();
    });
  });

  it('renders unicode emoji as text', () => {
    render(<EmojiRenderer emoji="😀" />);

    expect(screen.getByText('😀')).toBeInTheDocument();
  });

  it('renders unicode emoji as image on Windows and falls back to text on error', async () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

    render(<EmojiRenderer emoji="🇧🇷" alt="Bandeira" />);

    const image = screen.getByRole('img', { name: 'Bandeira' });
    expect(image).toHaveAttribute('src', expect.stringContaining('1f1e7-1f1f7.svg'));

    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.getByText('🇧🇷')).toBeInTheDocument();
    });
  });
});
