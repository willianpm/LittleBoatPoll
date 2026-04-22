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

const DEFAULT_SYSTEM_EMOJI_ENTRIES: ReadonlyArray<{ emoji: string; label: string }> = [
  { emoji: '😀', label: 'Smiling' },
  { emoji: '😂', label: 'Laughing' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😍', label: 'Loving' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '👍', label: 'Approval' },
  { emoji: '👎', label: 'Disapproval' },
  { emoji: '🎉', label: 'Celebration' },
  { emoji: '🔥', label: 'Hot' },
  { emoji: '✨', label: 'Sparkles' },
  { emoji: '👏', label: 'Clapping' },
  { emoji: '🙏', label: 'Thanks' },
  { emoji: '👌', label: 'Perfect' },
  { emoji: '✋', label: 'Stop' },
  { emoji: '👋', label: 'Wave' },
  { emoji: '✅', label: 'Approved' },
  { emoji: '❌', label: 'Rejected' },
  { emoji: '☑️', label: 'Checked' },
  { emoji: '⭕', label: 'Circle' },
  { emoji: '❓', label: 'Question' },
  { emoji: '❗', label: 'Important' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🌟', label: 'Glowing Star' },
  { emoji: '💯', label: 'Perfect Score' },
  { emoji: '🚀', label: 'Launch' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '🎯', label: 'Target' },
  { emoji: '📊', label: 'Statistics' },
  { emoji: '📈', label: 'Growth' },
  { emoji: '🎲', label: 'Random' },
  { emoji: '🎪', label: 'Entertainment' },
  { emoji: '📝', label: 'Document' },
  { emoji: '🏆', label: 'Trophy' },
  { emoji: '🥇', label: 'Champion' },
  { emoji: '😲', label: 'Shocked' },
  { emoji: '🤷', label: 'Unsure' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🎭', label: 'Theater' },
  { emoji: '📢', label: 'Announcement' },
];

export const DEFAULT_SYSTEM_EMOJIS = DEFAULT_SYSTEM_EMOJI_ENTRIES.map((entry) => entry.emoji);

const DEFAULT_SYSTEM_EMOJI_LABELS = new Map(DEFAULT_SYSTEM_EMOJI_ENTRIES.map((entry) => [entry.emoji, entry.label]));

export function getDiscordEmojiUrlFromEmoji(emoji: DashboardGuildEmoji): string {
  const extension = emoji.animated ? 'gif' : 'png';
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
