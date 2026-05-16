import type { DashboardGuildEmoji } from './dashboard-api';
import { isValidDiscordCustomEmoji, isValidDiscordEmoji } from './emoji-validation';

export interface PollFormOptionInput {
  id: string;
  text: string;
  emoji: string;
}

export interface PollFormOptionsValidationResult {
  errors: Record<string, string>;
  normalizedOptions: Array<{ id: string; text: string; emoji: string }>;
  hasErrors: boolean;
}

export function normalizePollFormOptions(
  options: PollFormOptionInput[],
): Array<{ id: string; text: string; emoji: string }> {
  return options
    .map((option) => ({
      id: option.id,
      text: option.text.trim(),
      emoji: option.emoji.trim(),
    }))
    .filter((option) => option.text.length > 0 || option.emoji.length > 0);
}

export function validatePollFormOptions(
  options: PollFormOptionInput[],
  serverEmojis: DashboardGuildEmoji[],
): PollFormOptionsValidationResult {
  const normalizedOptions = normalizePollFormOptions(options);
  const errors: Record<string, string> = {};
  const validEmojiIdentifiers = new Set(serverEmojis.map((emoji) => emoji.identifier));

  normalizedOptions.forEach((option, index) => {
    if (!option.text) {
      errors[option.id] = `Preencha o texto da opção ${index + 1}`;
      return;
    }

    if (!option.emoji) {
      errors[option.id] = `Selecione um emoji válido para a opção ${index + 1}`;
      return;
    }

    if (!isValidDiscordEmoji(option.emoji)) {
      errors[option.id] = `Selecione um emoji válido para a opção ${index + 1}`;
      return;
    }

    if (isValidDiscordCustomEmoji(option.emoji) && !validEmojiIdentifiers.has(option.emoji)) {
      errors[option.id] = 'Selecione um emoji da lista do servidor para esta opção.';
    }
  });

  return {
    errors,
    normalizedOptions,
    hasErrors: Object.keys(errors).length > 0,
  };
}
