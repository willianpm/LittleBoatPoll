import type { DashboardGuildEmoji } from './dashboard-api';
import { isValidDiscordCustomEmoji } from './emoji-validation';

export type UnifiedEmojiSource = 'custom' | 'default';

export interface UnifiedEmoji {
  key: string;
  value: string;
  name: string;
  source: UnifiedEmojiSource;
  isCustom: boolean;
  id?: string;
  identifier?: string;
  animated?: boolean;
  unicode?: string;
  url?: string;
}

/** Default Discord emojis available in the standard reaction picker */
const DEFAULT_SYSTEM_EMOJI_ENTRIES: ReadonlyArray<{ emoji: string; label: string }> = [
  // Face & emotion reactions
  { emoji: '😀', label: 'Smiling' },
  { emoji: '😂', label: 'Laughing' },
  { emoji: '😍', label: 'Loving' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😲', label: 'Shocked' },
  // Heart reactions
  { emoji: '❤️', label: 'Love' },
  // Hand reactions
  { emoji: '👍', label: 'Approval' },
  { emoji: '👎', label: 'Disapproval' },
  { emoji: '👏', label: 'Clapping' },
  { emoji: '🙏', label: 'Thanks' },
  { emoji: '✋', label: 'Stop' },
  // Celebration & success
  { emoji: '🎉', label: 'Celebration' },
  { emoji: '✅', label: 'Approved' },
  { emoji: '❌', label: 'Rejected' },
  // Other common reactions
  { emoji: '⭐', label: 'Star' },
  { emoji: '🔥', label: 'Hot' },
];

export const DEFAULT_SYSTEM_EMOJIS = DEFAULT_SYSTEM_EMOJI_ENTRIES.map((entry) => entry.emoji);

const DEFAULT_SYSTEM_EMOJI_LABELS = new Map(DEFAULT_SYSTEM_EMOJI_ENTRIES.map((entry) => [entry.emoji, entry.label]));

export function getDiscordEmojiUrlFromEmoji(emoji: DashboardGuildEmoji): string {
  const extension = emoji.animated ? 'gif' : 'webp';
  return `https://cdn.discordapp.com/emojis/${emoji.id}.${extension}?size=64&quality=lossless`;
}

function normalizeDefaultEmoji(emoji: string): UnifiedEmoji | null {
  const normalized = emoji.trim();
  if (!normalized) return null;

  return {
    key: `default:${normalized}`,
    value: normalized,
    name: DEFAULT_SYSTEM_EMOJI_LABELS.get(normalized) ?? normalized,
    source: 'default',
    isCustom: false,
    unicode: normalized,
  };
}

function normalizeCustomEmoji(emoji: DashboardGuildEmoji): UnifiedEmoji | null {
  if (!emoji?.identifier || !isValidDiscordCustomEmoji(emoji.identifier)) return null;

  return {
    key: `custom:${emoji.identifier}`,
    value: emoji.identifier,
    name: emoji.name,
    source: 'custom',
    isCustom: true,
    id: emoji.id,
    identifier: emoji.identifier,
    animated: emoji.animated,
    url: getDiscordEmojiUrlFromEmoji(emoji),
  };
}

export function mergeUnifiedEmojis(params: {
  customEmojis: DashboardGuildEmoji[];
  defaultEmojis?: readonly string[];
  selectedValues?: string[];
}): UnifiedEmoji[] {
  const { customEmojis, defaultEmojis = DEFAULT_SYSTEM_EMOJIS, selectedValues = [] } = params;
  const merged = new Map<string, UnifiedEmoji>();

  customEmojis.forEach((emoji) => {
    const normalized = normalizeCustomEmoji(emoji);
    if (!normalized || merged.has(normalized.key)) return;
    merged.set(normalized.key, normalized);
  });

  const includeDefault = (emoji: string) => {
    const normalized = normalizeDefaultEmoji(emoji);
    if (!normalized || merged.has(normalized.key)) return;
    merged.set(normalized.key, normalized);
  };

  defaultEmojis.forEach(includeDefault);

  selectedValues.forEach((value) => {
    const normalized = value.trim();
    if (!normalized || isValidDiscordCustomEmoji(normalized)) return;
    includeDefault(normalized);
  });

  return Array.from(merged.values());
}

export function getAvailableEmojis(
  serverEmojis: DashboardGuildEmoji[],
  defaultEmojis: readonly string[] = DEFAULT_SYSTEM_EMOJIS,
): UnifiedEmoji[] {
  return mergeUnifiedEmojis({
    customEmojis: serverEmojis,
    defaultEmojis,
  });
}

export function buildEmojiLookupByValue(emojis: UnifiedEmoji[]): Map<string, UnifiedEmoji> {
  return new Map(emojis.map((emoji) => [emoji.value, emoji]));
}
