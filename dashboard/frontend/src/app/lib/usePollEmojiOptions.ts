import { useMemo } from 'react';
import type { DashboardGuildEmoji } from './dashboard-api';
import { getAvailableEmojisForPollOptions, getSelectedUnicodeEmojisFromOptions } from './emoji-merge';

export function usePollEmojiOptions(serverEmojis: DashboardGuildEmoji[], options: ReadonlyArray<{ emoji: string }>) {
  const selectedSignature = useMemo(() => getSelectedUnicodeEmojisFromOptions(options).join('\u0001'), [options]);

  return useMemo(
    () => getAvailableEmojisForPollOptions(serverEmojis, options),
    [serverEmojis, selectedSignature, options],
  );
}
