import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, X, Sparkles } from 'lucide-react';
import { PollEmojiPickerField } from '../components/PollEmojiPickerField';
import { toast } from 'sonner';
import {
  createDraft,
  getGuildEmojis,
  getGuildChannels,
  getGuilds,
  type DashboardChannel,
  type DashboardGuild,
  type DashboardGuildEmoji,
} from '../lib/dashboard-api';
import { usePollEmojiOptions } from '../lib/usePollEmojiOptions';
import { validatePollFormOptions } from '../lib/poll-option-validation';

type PollFormOption = {
  id: string;
  text: string;
  emoji: string;
};

function createEmptyOption(id: string): PollFormOption {
  return {
    id,
    text: '',
    emoji: '',
  };
}

export function CreatePoll() {
  const [title, setTitle] = useState('');
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [durationKey, setDurationKey] = useState<'1h' | '6h' | '12h' | '24h' | '3d' | '7d'>('24h');
  const [maxVotes, setMaxVotes] = useState(1);
  const [subscriberWeight, setSubscriberWeight] = useState<'yes' | 'no'>('no');
  const [guilds, setGuilds] = useState<DashboardGuild[]>([]);
  const [channels, setChannels] = useState<DashboardChannel[]>([]);
  const [guildEmojis, setGuildEmojis] = useState<DashboardGuildEmoji[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingGuildEmojis, setLoadingGuildEmojis] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [options, setOptions] = useState<PollFormOption[]>([createEmptyOption('1'), createEmptyOption('2')]);
  const [optionErrors, setOptionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadGuilds() {
      setLoadingGuilds(true);
      try {
        const data = await getGuilds();
        if (!isMounted) return;

        setGuilds(data);
        const activeGuild = data.find((guild) => guild.isActive);
        if (activeGuild) {
          setSelectedGuildId(activeGuild.id);
        }
      } catch (error) {
        if (!isMounted) return;
        toast.error(error instanceof Error ? error.message : 'Falha ao carregar servidores');
      } finally {
        if (isMounted) {
          setLoadingGuilds(false);
        }
      }
    }

    loadGuilds();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadChannels() {
      if (!selectedGuildId) {
        setChannels([]);
        setSelectedChannelId('');
        return;
      }

      setLoadingChannels(true);
      setSelectedChannelId('');

      try {
        const data = await getGuildChannels(selectedGuildId);
        if (!isMounted) return;
        setChannels(data);
      } catch (error) {
        if (!isMounted) return;
        setChannels([]);
        toast.error(error instanceof Error ? error.message : 'Falha ao carregar canais');
      } finally {
        if (isMounted) {
          setLoadingChannels(false);
        }
      }
    }

    loadChannels();

    return () => {
      isMounted = false;
    };
  }, [selectedGuildId]);

  useEffect(() => {
    let isMounted = true;

    async function loadGuildEmojis() {
      if (!selectedGuildId) {
        setGuildEmojis([]);
        return;
      }

      setLoadingGuildEmojis(true);

      try {
        const emojis = await getGuildEmojis(selectedGuildId);
        if (!isMounted) return;

        setGuildEmojis(emojis);
        setGuilds((currentGuilds) =>
          currentGuilds.map((guild) => (guild.id === selectedGuildId ? { ...guild, emojis } : guild)),
        );
      } catch (error) {
        if (!isMounted) return;
        setGuildEmojis([]);
        toast.error(error instanceof Error ? error.message : 'Falha ao carregar emojis do servidor');
      } finally {
        if (isMounted) {
          setLoadingGuildEmojis(false);
        }
      }
    }

    loadGuildEmojis();

    return () => {
      isMounted = false;
    };
  }, [selectedGuildId]);

  const hasOptionErrors = useMemo(
    () => options.some((option) => Boolean(optionErrors[option.id])),
    [optionErrors, options],
  );

  const selectedGuild = useMemo(
    () => guilds.find((guild) => guild.id === selectedGuildId) || null,
    [guilds, selectedGuildId],
  );

  const serverEmojis = useMemo(
    () => (guildEmojis.length > 0 ? guildEmojis : selectedGuild?.emojis || []),
    [guildEmojis, selectedGuild],
  );

  const mergedEmojis = usePollEmojiOptions(serverEmojis, options);

  const addOption = useCallback(() => {
    setOptions((current) => {
      if (current.length >= 20) return current;
      return [...current, createEmptyOption(Date.now().toString())];
    });
  }, []);

  const removeOption = useCallback((id: string) => {
    setOptions((current) => {
      if (current.length <= 2) return current;
      return current.filter((opt) => opt.id !== id);
    });
  }, []);

  const updateOption = useCallback((id: string, field: 'text' | 'emoji', value: string) => {
    setOptions((current) => current.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt)));
    setOptionErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGuildId) {
      toast.error('Selecione um servidor');
      return;
    }

    if (!selectedChannelId) {
      toast.error('Selecione um canal');
      return;
    }

    const selectedChannelExists = channels.some((channel) => channel.id === selectedChannelId);
    if (!selectedChannelExists) {
      toast.error('Canal inválido para o servidor selecionado. Selecione novamente.');
      return;
    }

    const { errors: nextOptionErrors, normalizedOptions, hasErrors } = validatePollFormOptions(options, serverEmojis);

    if (hasErrors) {
      setOptionErrors(nextOptionErrors);
      toast.error('Corrija os emojis e textos das opções antes de salvar.');
      return;
    }

    if (normalizedOptions.length < 2) {
      toast.error('A enquete precisa de pelo menos 2 opções válidas com emoji');
      return;
    }

    if (!title.trim()) {
      toast.error('Informe um título para a enquete');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createDraft({
        guildId: selectedGuildId,
        channelId: selectedChannelId,
        title: title.trim(),
        options: normalizedOptions.map((option) => ({ text: option.text, emoji: option.emoji })),
        maxVotes,
        pesoMensalista: subscriberWeight === 'yes' ? 'sim' : 'nao',
        durationKey,
      });

      toast.success('Rascunho criado com sucesso!', {
        description: typeof result.message === 'string' ? result.message : 'Use a tela de Rascunhos para publicar.',
      });

      setTitle('');
      setDurationKey('24h');
      setMaxVotes(1);
      setSubscriberWeight('no');
      setOptions([createEmptyOption('1'), createEmptyOption('2')]);
      setOptionErrors({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar enquete');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl mb-2 dark:text-white">Criar Nova Enquete</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure e publique uma nova enquete no Discord</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-4 md:p-6 mb-4 md:mb-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg md:text-xl mb-4 dark:text-white">Informações Básicas</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="dark:text-gray-200">
                Título da Enquete *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Votação para o livro do mês de Abril de 2026"
                required
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="server" className="dark:text-gray-200">
                  Servidor *
                </Label>
                <Select
                  required
                  value={selectedGuildId}
                  onValueChange={setSelectedGuildId}
                  disabled={loadingGuilds || guilds.length === 0}
                >
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder={loadingGuilds ? 'Carregando servidores...' : 'Selecione um servidor'} />
                  </SelectTrigger>
                  <SelectContent>
                    {guilds.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="channel" className="dark:text-gray-200">
                  Canal *
                </Label>
                <Select
                  required
                  value={selectedChannelId}
                  onValueChange={setSelectedChannelId}
                  disabled={!selectedGuildId || loadingChannels || channels.length === 0}
                >
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue
                      placeholder={
                        !selectedGuildId
                          ? 'Selecione um servidor'
                          : loadingChannels
                            ? 'Carregando canais...'
                            : 'Selecione um canal'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="duration" className="dark:text-gray-200">
                Duração
              </Label>
              <Select value={durationKey} onValueChange={(value) => setDurationKey(value as typeof durationKey)}>
                <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hora</SelectItem>
                  <SelectItem value="6h">6 horas</SelectItem>
                  <SelectItem value="12h">12 horas</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="3d">3 dias</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 mb-4 md:mb-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-lg md:text-xl dark:text-white">Opções de Resposta</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={options.length >= 20}
              className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Plus className="size-4 mr-2" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-24 md:w-28 shrink-0">
                    <PollEmojiPickerField
                      value={option.emoji}
                      emojis={mergedEmojis}
                      disabled={loadingGuildEmojis}
                      loading={loadingGuildEmojis}
                      ariaLabel={`Selecionar emoji da opção ${index + 1}`}
                      onValueChange={(value) => updateOption(option.id, 'emoji', value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={`Opção ${index + 1}`}
                      value={option.text}
                      onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      className="dark:hover:bg-gray-700 shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                {optionErrors[option.id] && (
                  <p className="text-xs text-red-600 dark:text-red-400">{optionErrors[option.id]}</p>
                )}
              </div>
            ))}
          </div>
          {!hasOptionErrors && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Emojis customizados do servidor e emojis padrão podem ser usados juntos em qualquer opção.
            </p>
          )}
        </Card>

        <Card className="p-4 md:p-6 mb-4 md:mb-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg md:text-xl mb-4 dark:text-white">Configurações Avançadas</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxVotes" className="dark:text-gray-200">
                  Número Máximo de Votos por Pessoa
                </Label>
                <Input
                  id="maxVotes"
                  type="number"
                  min="1"
                  max="20"
                  value={maxVotes}
                  onChange={(e) => {
                    const nextValue = Number.parseInt(e.target.value, 10);
                    setMaxVotes(Number.isNaN(nextValue) ? 1 : nextValue);
                  }}
                  placeholder="1"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Limite de opções que cada pessoa pode escolher
                </p>
              </div>

              <div>
                <Label htmlFor="subscriberWeight" className="dark:text-gray-200">
                  Mensalistas peso 2
                </Label>
                <Select value={subscriberWeight} onValueChange={(value: 'yes' | 'no') => setSubscriberWeight(value)}>
                  <SelectTrigger
                    id="subscriberWeight"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Votos de mensalistas contam em dobro</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Button type="submit" disabled={submitting} className="flex-1 bg-[#5865F2] hover:bg-[#4752C4]">
            <Sparkles className="size-4 mr-2" />
            {submitting ? 'Criando...' : 'Criar Enquete'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
