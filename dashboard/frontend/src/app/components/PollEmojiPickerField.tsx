import { useMemo, useState, type CSSProperties } from 'react';
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import type { UnifiedEmoji } from '../lib/emoji-merge';

type EmojiPickerCustomEntry = {
  id: string;
  names: string[];
  imgUrl: string;
};

interface PollEmojiPickerFieldProps {
  value: string;
  emojis: UnifiedEmoji[];
  disabled?: boolean;
  loading?: boolean;
  onValueChange: (value: string) => void;
  ariaLabel?: string;
}

export function PollEmojiPickerField({
  value,
  emojis,
  disabled = false,
  loading = false,
  onValueChange,
  ariaLabel,
}: PollEmojiPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedEmoji = useMemo(() => emojis.find((emoji) => emoji.value === value) ?? null, [emojis, value]);

  const customEmojis = useMemo<EmojiPickerCustomEntry[]>(
    () =>
      emojis
        .filter((emoji) => emoji.isCustom && Boolean(emoji.url))
        .map((emoji) => ({
          // Keep the persisted Discord identifier as the picker id to avoid post-click remapping bugs.
          id: emoji.value,
          names: [emoji.name],
          imgUrl: emoji.url ?? '',
        })),
    [emojis],
  );

  const customEmojiIdentifierById = useMemo(
    () => new Map(customEmojis.map((emoji) => [emoji.id, emoji.id])),
    [customEmojis],
  );

  const handleEmojiClick = (emoji: EmojiClickData) => {
    const nextValue = emoji.isCustom
      ? (customEmojiIdentifierById.get(emoji.emoji) ?? customEmojiIdentifierById.get(emoji.unified) ?? emoji.emoji)
      : emoji.emoji;

    onValueChange(nextValue);
    setIsOpen(false);
  };

  const pickerStyle = {
    '--epr-emoji-size': '26px',
    '--epr-emoji-gap': '10px',
    '--epr-category-navigation-button-size': '30px',
    '--epr-search-input-height': '38px',
  } as CSSProperties;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          aria-label={ariaLabel ?? 'Selecionar emoji'}
          className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {selectedEmoji?.isCustom && selectedEmoji.url && (
            <img
              src={selectedEmoji.url}
              alt={`Emoji ${selectedEmoji.name}`}
              className="size-5 object-contain"
              loading="lazy"
            />
          )}
          {!selectedEmoji?.isCustom && selectedEmoji?.unicode && (
            <span className="text-base leading-none" aria-hidden="true">
              {selectedEmoji.unicode}
            </span>
          )}
          {!selectedEmoji && <Smile className="size-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-[330px] p-2">
        {loading && <p className="px-2 pb-2 text-xs text-gray-600 dark:text-gray-300">Carregando emojis...</p>}
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          searchPlaceholder="Buscar emoji"
          theme={Theme.AUTO}
          emojiStyle={EmojiStyle.NATIVE}
          lazyLoadEmojis
          skinTonesDisabled
          previewConfig={{ showPreview: false }}
          customEmojis={customEmojis}
          style={pickerStyle}
          width="100%"
          height={340}
        />
      </PopoverContent>
    </Popover>
  );
}
