import { useMemo } from 'react';
import type { DashboardGuildEmoji } from './dashboard-api';
import { getAvailableEmojisForPollOptions } from './emoji-merge';

export function usePollEmojiOptions(serverEmojis: DashboardGuildEmoji[], options: ReadonlyArray<{ emoji: string }>) {
  return useMemo(() => getAvailableEmojisForPollOptions(serverEmojis, options), [serverEmojis, options]);
}
