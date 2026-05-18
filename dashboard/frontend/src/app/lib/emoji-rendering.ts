import { isValidDiscordUnicodeEmoji } from './emoji-validation';

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    platform?: string;
  };
};

const TWEMOJI_BASE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg';

function isBrowserEnvironment() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function isWindowsPlatform() {
  if (!isBrowserEnvironment()) return false;

  const navigatorWithUAData = navigator as NavigatorWithUAData;
  if (navigatorWithUAData.userAgentData?.platform) {
    return /windows/i.test(navigatorWithUAData.userAgentData.platform);
  }

  return /windows/i.test(navigator.userAgent);
}

function toTwemojiCodepoints(emoji: string) {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0))
    .filter((codepoint): codepoint is number => typeof codepoint === 'number')
    .map((codepoint) => codepoint.toString(16).padStart(4, '0'))
    .join('-');
}

export function getUnicodeEmojiImageUrl(emoji: string | null | undefined) {
  if (!emoji || typeof emoji !== 'string') return null;

  const normalized = emoji.trim();
  if (!normalized) return null;
  if (!isValidDiscordUnicodeEmoji(normalized)) return null;

  const codepoints = toTwemojiCodepoints(normalized);
  if (!codepoints) return null;

  return `${TWEMOJI_BASE_URL}/${codepoints}.svg`;
}

export function shouldRenderUnicodeEmojiAsImage(emoji: string | null | undefined) {
  if (!emoji || typeof emoji !== 'string') return false;

  const normalized = emoji.trim();
  if (!normalized) return false;
  if (!isValidDiscordUnicodeEmoji(normalized)) return false;

  return isWindowsPlatform();
}
