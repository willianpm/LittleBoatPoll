const DISCORD_CUSTOM_EMOJI_REGEX = /^<a?:[a-zA-Z0-9_]{2,32}:\d{17,20}>$/;

const DISCORD_UNICODE_EMOJI_REGEX =
  /^(?:\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?)*)$/u;

export function isValidDiscordCustomEmoji(value: string): boolean {
  return DISCORD_CUSTOM_EMOJI_REGEX.test(value.trim());
}

export function isValidDiscordUnicodeEmoji(value: string): boolean {
  return DISCORD_UNICODE_EMOJI_REGEX.test(value.trim());
}

export function isValidDiscordEmoji(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;

  return isValidDiscordCustomEmoji(normalized) || isValidDiscordUnicodeEmoji(normalized);
}
