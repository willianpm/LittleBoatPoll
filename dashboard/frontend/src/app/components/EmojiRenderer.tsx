import React, { useState } from 'react';
import { getDiscordEmojiUrlFromEmoji } from '../lib/emoji-merge';

interface Props {
  emoji?: string | null;
  emojiId?: string | null;
  emojiAnimated?: boolean | null;
  emojiUrl?: string | null;
  className?: string;
  alt?: string;
}

function parseDiscordIdentifier(identifier: string | null | undefined) {
  if (!identifier || typeof identifier !== 'string') return null;
  const m = identifier.match(/^<(?:(a):)?([a-zA-Z0-9_]{2,32}):(\d{17,20})>$/);
  if (!m) return null;
  return { id: m[3], animated: Boolean(m[1] === 'a') };
}

function parseLegacyEmojiId(identifier: string | null | undefined) {
  if (!identifier || typeof identifier !== 'string') return null;

  const trimmed = identifier.trim();
  if (!/^\d{17,20}$/.test(trimmed)) return null;

  return { id: trimmed, animated: false };
}

function renderCustomEmojiFallback(className: string, alt: string) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      title={alt || 'emoji indisponível'}
      aria-label={alt || 'emoji indisponível'}
    >
      ◻
    </span>
  );
}

export function EmojiRenderer({ emoji, emojiId, emojiAnimated, emojiUrl, className = '', alt = '' }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackAlt = alt || 'emoji indisponível';

  // Prefer explicit URL/id metadata provided by the API.
  const resolvedEmojiId = emojiId || parseDiscordIdentifier(emoji)?.id || parseLegacyEmojiId(emoji)?.id || null;
  const resolvedAnimated = Boolean(
    emojiAnimated ?? parseDiscordIdentifier(emoji)?.animated ?? parseLegacyEmojiId(emoji)?.animated ?? false,
  );
  const resolvedCustomEmojiUrl =
    emojiUrl ||
    (resolvedEmojiId ? getDiscordEmojiUrlFromEmoji({ id: resolvedEmojiId, animated: resolvedAnimated } as any) : null);

  if (resolvedCustomEmojiUrl) {
    if (!imageFailed) {
      return (
        <img
          src={resolvedCustomEmojiUrl}
          alt={alt || 'emoji'}
          className={className}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      );
    }

    return renderCustomEmojiFallback(className, fallbackAlt);
  }

  // Try to parse the stored identifier string
  const parsed = parseDiscordIdentifier(emoji);
  if (parsed) {
    const url = getDiscordEmojiUrlFromEmoji({ id: parsed.id, animated: parsed.animated } as any);

    if (!imageFailed) {
      return (
        <img src={url} alt={alt || 'emoji'} className={className} loading="lazy" onError={() => setImageFailed(true)} />
      );
    }

    return renderCustomEmojiFallback(className, fallbackAlt);
  }

  const legacyParsed = parseLegacyEmojiId(emoji);
  if (legacyParsed) {
    const url = getDiscordEmojiUrlFromEmoji({ id: legacyParsed.id, animated: legacyParsed.animated } as any);

    if (!imageFailed) {
      return (
        <img src={url} alt={alt || 'emoji'} className={className} loading="lazy" onError={() => setImageFailed(true)} />
      );
    }

    return renderCustomEmojiFallback(className, fallbackAlt);
  }

  // Fallback to rendering the emoji as text (unicode)
  if (emoji && !/^\d{17,20}$/.test(emoji.trim())) {
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
