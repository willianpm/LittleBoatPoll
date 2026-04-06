import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Send, FileText, Trash2, Edit, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDraft,
  deleteDraft,
  editDraft,
  getGuildChannels,
  getGuilds,
  getDraftContextTargets,
  publishDraft,
  type DashboardChannel,
  type DashboardGuild,
  type DashboardDraftContext,
} from '../lib/dashboard-api';

type DraftItem = DashboardDraftContext;

export function PollDrafts() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSelectedGuildId, setCreateSelectedGuildId] = useState('');
  const [createSelectedChannelId, setCreateSelectedChannelId] = useState('');
  const [createMaxVotes, setCreateMaxVotes] = useState(1);
  const [createSubscriberWeight, setCreateSubscriberWeight] = useState<'yes' | 'no'>('no');
  const [createGuilds, setCreateGuilds] = useState<DashboardGuild[]>([]);
  const [createChannels, setCreateChannels] = useState<DashboardChannel[]>([]);
  const [createLoadingGuilds, setCreateLoadingGuilds] = useState(true);
  const [createLoadingChannels, setCreateLoadingChannels] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createOptions, setCreateOptions] = useState([
    { id: '1', text: '', emoji: '' },
    { id: '2', text: '', emoji: '' },
  ]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOptionsCsv, setEditOptionsCsv] = useState('');
  const [editMaxVotes, setEditMaxVotes] = useState(1);
  const [editSubscriberWeight, setEditSubscriberWeight] = useState<'sim' | 'nao'>('nao');

  const sortedDrafts = useMemo(
    () => [...drafts].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))),
    [drafts],
  );

  useEffect(() => {
    void loadDrafts();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCreateGuilds() {
      setCreateLoadingGuilds(true);
      try {
        const data = await getGuilds();
        if (!isMounted) return;

        setCreateGuilds(data);
        const activeGuild = data.find((guild) => guild.isActive);
        if (activeGuild) {
          setCreateSelectedGuildId(activeGuild.id);
        }
      } catch (error) {
        if (!isMounted) return;
        toast.error(error instanceof Error ? error.message : 'Falha ao carregar servidores');
      } finally {
        if (isMounted) {
          setCreateLoadingGuilds(false);
        }
      }
    }

    loadCreateGuilds();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCreateChannels() {
      if (!createSelectedGuildId) {
        setCreateChannels([]);
        setCreateSelectedChannelId('');
        return;
      }

      setCreateLoadingChannels(true);
      setCreateSelectedChannelId('');

      try {
        const data = await getGuildChannels(createSelectedGuildId);
        if (!isMounted) return;
        setCreateChannels(data);
      } catch (error) {
        if (!isMounted) return;
        setCreateChannels([]);
        toast.error(error instanceof Error ? error.message : 'Falha ao carregar canais');
      } finally {
        if (isMounted) {
          setCreateLoadingChannels(false);
        }
      }
    }

    loadCreateChannels();

    return () => {
      isMounted = false;
    };
  }, [createSelectedGuildId]);

  const validCreateOptions = useMemo(
    () => createOptions.map((option) => option.text.trim()).filter(Boolean),
    [createOptions],
  );

  const addCreateOption = () => {
    if (createOptions.length < 10) {
      setCreateOptions([...createOptions, { id: Date.now().toString(), text: '', emoji: '' }]);
    }
  };

  const removeCreateOption = (id: string) => {
    if (createOptions.length > 2) {
      setCreateOptions(createOptions.filter((opt) => opt.id !== id));
    }
  };

  const updateCreateOption = (id: string, field: 'text' | 'emoji', value: string) => {
    setCreateOptions(createOptions.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt)));
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createSelectedGuildId) {
      toast.error('Selecione um servidor');
      return;
    }

    if (!createSelectedChannelId) {
      toast.error('Selecione um canal');
      return;
    }

    if (validCreateOptions.length < 2) {
      toast.error('O rascunho precisa de pelo menos 2 opções');
      return;
    }

    if (!createTitle.trim()) {
      toast.error('Informe um título para o rascunho');
      return;
    }

    setCreateSubmitting(true);
    try {
      const result = await createDraft({
        guildId: createSelectedGuildId,
        channelId: createSelectedChannelId,
        title: createTitle.trim(),
        optionsCsv: validCreateOptions.join(', '),
        maxVotes: createMaxVotes,
        pesoMensalista: createSubscriberWeight === 'yes' ? 'sim' : 'nao',
      });

      toast.success('Rascunho criado com sucesso!', {
        description: typeof result.message === 'string' ? result.message : 'Use a lista abaixo para publicar.',
      });

      setCreateTitle('');
      setCreateDescription('');
      setCreateMaxVotes(1);
      setCreateSubscriberWeight('no');
      setCreateOptions([
        { id: '1', text: '', emoji: '' },
        { id: '2', text: '', emoji: '' },
      ]);
      await loadDrafts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar rascunho');
    } finally {
      setCreateSubmitting(false);
    }
  };

  async function loadDrafts() {
    setLoadingDrafts(true);
    try {
      const data = await getDraftContextTargets();
      setDrafts(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao carregar rascunhos');
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }

  const handlePublishDraft = async (id: string) => {
    setActionLoadingId(id);
    try {
      const result = await publishDraft(id);
      toast.success(typeof result.message === 'string' ? result.message : 'Enquete publicada com sucesso!');
      await loadDrafts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao publicar rascunho');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    setActionLoadingId(id);
    try {
      const result = await deleteDraft(id);
      toast.success(typeof result.message === 'string' ? result.message : 'Rascunho excluído!');
      await loadDrafts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao excluir rascunho');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (draft: DraftItem) => {
    setEditingDraft(draft);
    setEditTitle(draft.title || '');
    setEditOptionsCsv('');
    setEditMaxVotes(1);
    setEditSubscriberWeight('nao');
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;

    if (!editTitle.trim()) {
      toast.error('Informe um título para o rascunho');
      return;
    }

    setActionLoadingId(editingDraft.id);
    try {
      const result = await editDraft({
        id: editingDraft.id,
        title: editTitle.trim(),
        optionsCsv: editOptionsCsv.trim() || undefined,
        maxVotes: editMaxVotes,
        pesoMensalista: editSubscriberWeight,
      });

      toast.success(typeof result.message === 'string' ? result.message : 'Rascunho atualizado com sucesso!');
      setIsEditOpen(false);
      setEditingDraft(null);
      await loadDrafts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao editar rascunho');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl mb-2 dark:text-white">Rascunhos de Enquete</h1>
            <p className="text-gray-600 dark:text-gray-400">Salve, edite e publique rascunhos quando estiver pronto</p>
          </div>
          <Button
            className="bg-[#5865F2] hover:bg-[#4752C4] w-full sm:w-auto"
            onClick={() => document.getElementById('draft-create-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Plus className="size-4 mr-2" />
            Novo Rascunho
          </Button>
        </div>
      </div>

      <Card id="draft-create-form" className="p-4 md:p-6 mb-6 md:mb-8 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg md:text-xl dark:text-white">Criar Rascunho</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use este formulário para salvar um rascunho de enquete.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateDraft} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-title" className="dark:text-gray-200">
                Título do Rascunho *
              </Label>
              <Input
                id="create-title"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Ex: Qual jogo jogaremos hoje?"
                required
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="create-description" className="dark:text-gray-200">
                Descrição do rascunho
              </Label>
              <Textarea
                id="create-description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Adicione mais detalhes sobre o rascunho..."
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-server" className="dark:text-gray-200">
                  Servidor *
                </Label>
                <Select
                  required
                  value={createSelectedGuildId}
                  onValueChange={setCreateSelectedGuildId}
                  disabled={createLoadingGuilds || createGuilds.length === 0}
                >
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue
                      placeholder={createLoadingGuilds ? 'Carregando servidores...' : 'Selecione um servidor'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {createGuilds.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="create-channel" className="dark:text-gray-200">
                  Canal *
                </Label>
                <Select
                  required
                  value={createSelectedChannelId}
                  onValueChange={setCreateSelectedChannelId}
                  disabled={!createSelectedGuildId || createLoadingChannels || createChannels.length === 0}
                >
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue
                      placeholder={
                        !createSelectedGuildId
                          ? 'Selecione um servidor'
                          : createLoadingChannels
                            ? 'Carregando canais...'
                            : 'Selecione um canal'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {createChannels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="create-duration" className="dark:text-gray-200">
                Duração do rascunho
              </Label>
              <Select defaultValue="24h">
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

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base md:text-lg dark:text-white">Opções de Resposta</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCreateOption}
                disabled={createOptions.length >= 10}
                className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Plus className="size-4 mr-2" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>

            <div className="space-y-3">
              {createOptions.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2 md:gap-3">
                  <div className="w-12 md:w-16">
                    <Input
                      placeholder="😊"
                      value={option.emoji}
                      onChange={(e) => updateCreateOption(option.id, 'emoji', e.target.value)}
                      maxLength={2}
                      className="text-center dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={`Opção ${index + 1}`}
                      value={option.text}
                      onChange={(e) => updateCreateOption(option.id, 'text', e.target.value)}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  {createOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCreateOption(option.id)}
                      className="dark:hover:bg-gray-700 shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base md:text-lg dark:text-white">Configurações Avançadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-maxVotes" className="dark:text-gray-200">
                  Número Máximo de Votos por Pessoa
                </Label>
                <Input
                  id="create-maxVotes"
                  type="number"
                  min="1"
                  max="10"
                  value={createMaxVotes}
                  onChange={(e) => {
                    const nextValue = Number.parseInt(e.target.value, 10);
                    setCreateMaxVotes(Number.isNaN(nextValue) ? 1 : nextValue);
                  }}
                  placeholder="1"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Limite de opções que cada pessoa pode escolher
                </p>
              </div>

              <div>
                <Label htmlFor="create-subscriberWeight" className="dark:text-gray-200">
                  Mensalistas peso 2
                </Label>
                <Select
                  value={createSubscriberWeight}
                  onValueChange={(value: 'yes' | 'no') => setCreateSubscriberWeight(value)}
                >
                  <SelectTrigger
                    id="create-subscriberWeight"
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

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Button type="submit" disabled={createSubmitting} className="flex-1 bg-[#5865F2] hover:bg-[#4752C4]">
              <Sparkles className="size-4 mr-2" />
              {createSubmitting ? 'Criando...' : 'Criar Rascunho'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {loadingDrafts && (
          <Card className="p-8 md:p-12 text-center lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Carregando rascunhos...</p>
          </Card>
        )}

        {!loadingDrafts &&
          sortedDrafts.map((draft) => {
            const isActionLoading = actionLoadingId === draft.id;

            return (
              <Card key={draft.id} className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="size-5 text-gray-400 dark:text-gray-500 shrink-0" />
                      <h3 className="text-base md:text-lg dark:text-white truncate">{draft.title}</h3>
                    </div>
                    {draft.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{draft.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="truncate">Origem: dashboard</span>
                      <span>•</span>
                      <span>{formatDate(draft.updatedAt || '')}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700/50 shrink-0"
                  >
                    Rascunho
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Opções:</p>
                  <div className="space-y-2">
                    <div className="text-sm flex items-center gap-2 dark:text-gray-300">
                      <span className="truncate">{draft.optionsCount} opções no rascunho</span>
                    </div>
                    {draft.optionsCount > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">+{draft.optionsCount - 3} opções</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap" />

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    disabled={isActionLoading}
                    className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] min-w-[100px]"
                    onClick={() => handlePublishDraft(draft.id)}
                  >
                    <Send className="size-4 mr-2" />
                    {isActionLoading ? 'Publicando...' : 'Publicar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActionLoading}
                    onClick={() => openEditModal(draft)}
                    className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Edit className="size-4 mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActionLoading}
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="size-4 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </Card>
            );
          })}

        {!loadingDrafts && sortedDrafts.length === 0 && (
          <Card className="p-8 md:p-12 text-center lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <FileText className="size-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum rascunho salvo</p>
            <Button
              variant="outline"
              className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => document.getElementById('draft-create-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Plus className="size-4 mr-2" />
              Criar Primeiro Rascunho
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Editar Rascunho</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="dark:text-gray-200">
                Título
              </Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="edit-options" className="dark:text-gray-200">
                Opções (separadas por vírgula)
              </Label>
              <Input
                id="edit-options"
                value={editOptionsCsv}
                onChange={(e) => setEditOptionsCsv(e.target.value)}
                placeholder="Deixe vazio para manter as opções atuais"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="edit-max-votes" className="dark:text-gray-200">
                Máximo de votos
              </Label>
              <Input
                id="edit-max-votes"
                type="number"
                min="1"
                max="10"
                value={editMaxVotes}
                onChange={(e) => {
                  const nextValue = Number.parseInt(e.target.value, 10);
                  setEditMaxVotes(Number.isNaN(nextValue) ? 1 : nextValue);
                }}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="edit-subscriber-weight" className="dark:text-gray-200">
                Mensalistas peso 2
              </Label>
              <select
                id="edit-subscriber-weight"
                value={editSubscriberWeight}
                onChange={(e) => setEditSubscriberWeight(e.target.value === 'sim' ? 'sim' : 'nao')}
                className="mt-1 h-9 w-full rounded-md border border-gray-600 bg-gray-700 px-3 text-sm text-white"
              >
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editingDraft || actionLoadingId === editingDraft.id}
              className="bg-[#5865F2] hover:bg-[#4752C4]"
            >
              {editingDraft && actionLoadingId === editingDraft.id ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
