import React from 'react';
import { getDiscordEmojiUrlFromEmoji } from '../lib/emoji-merge';

interface Props {
  emoji?: string | null;
  emojiId?: string | null;
  emojiAnimated?: boolean | null;
  className?: string;
  alt?: string;
}

function parseDiscordIdentifier(identifier: string | null | undefined) {
  if (!identifier || typeof identifier !== 'string') return null;
  const m = identifier.match(/^<(?:(a):)?([a-zA-Z0-9_]{2,32}):(\d{17,20})>$/);
  if (!m) return null;
  return { id: m[3], animated: Boolean(m[1] === 'a') };
}

export function EmojiRenderer({ emoji, emojiId, emojiAnimated, className = '', alt = '' }: Props) {
  // Prefer explicit id/animated provided by the API
  if (emojiId) {
    const url = getDiscordEmojiUrlFromEmoji({ id: emojiId, animated: Boolean(emojiAnimated) } as any);
    return <img src={url} alt={alt || 'emoji'} className={className} loading="lazy" />;
  }

  // Try to parse the stored identifier string
  const parsed = parseDiscordIdentifier(emoji);
  if (parsed) {
    const url = getDiscordEmojiUrlFromEmoji({ id: parsed.id, animated: parsed.animated } as any);
    return <img src={url} alt={alt || 'emoji'} className={className} loading="lazy" />;
  }

  // Fallback to rendering the emoji as text (unicode)
  if (emoji) {
    return (
      <span className={className} aria-hidden="true">
        {emoji}
      </span>
    );
  }

  return null;
}

EmojiRenderer.displayName = 'EmojiRenderer';

export default EmojiRenderer;
