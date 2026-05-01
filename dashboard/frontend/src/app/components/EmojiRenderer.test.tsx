import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EmojiRenderer from './EmojiRenderer';

describe('EmojiRenderer', () => {
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
});
