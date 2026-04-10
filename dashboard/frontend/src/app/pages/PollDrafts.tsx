import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Send, FileText, Trash2, Edit, X, Server, Hash } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteDraft,
  editDraft,
  getDraftContextTargets,
  publishDraft,
  type DashboardDraftContext,
} from '../lib/dashboard-api';

type DraftItem = DashboardDraftContext;
const ALLOWED_DURATION_KEYS = new Set(['1h', '6h', '12h', '24h', '3d', '7d']);

export function PollDrafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOptions, setEditOptions] = useState<Array<{ id: string; text: string }>>([]);
  const [editMaxVotes, setEditMaxVotes] = useState(1);
  const [editSubscriberWeight, setEditSubscriberWeight] = useState<'sim' | 'nao'>('nao');
  const [editDurationKey, setEditDurationKey] = useState<'1h' | '6h' | '12h' | '24h' | '3d' | '7d'>('24h');

  const sortedDrafts = useMemo(
    () => [...drafts].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))),
    [drafts],
  );

  useEffect(() => {
    void loadDrafts();
  }, []);

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
    const targetDraft = drafts.find((draft) => draft.id === id);
    if (!targetDraft?.guildId || !targetDraft?.channelId) {
      toast.error('Este rascunho não possui servidor/canal vinculados para publicação segura');
      return;
    }

    setActionLoadingId(id);
    try {
      const result = await publishDraft({
        id,
        guildId: targetDraft.guildId,
        channelId: targetDraft.channelId,
      });
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
    const draftOptions = Array.isArray(draft.options) ? draft.options : [];
    const normalizedOptions = draftOptions
      .filter((option) => typeof option === 'string')
      .map((option, index) => ({ id: `${draft.id}-${index}`, text: option }));

    setEditingDraft(draft);
    setEditTitle(draft.title || '');
    setEditOptions(
      normalizedOptions.length >= 2
        ? normalizedOptions
        : [
            { id: `${draft.id}-fallback-1`, text: normalizedOptions[0]?.text || '' },
            { id: `${draft.id}-fallback-2`, text: '' },
          ],
    );
    const parsedMaxVotes = Number(draft.maxVotes ?? 1);
    const safeMaxVotes = Number.isFinite(parsedMaxVotes) ? Math.min(10, Math.max(1, Math.trunc(parsedMaxVotes))) : 1;
    const normalizedDurationKey =
      typeof draft.durationKey === 'string' && ALLOWED_DURATION_KEYS.has(draft.durationKey) ? draft.durationKey : '24h';

    setEditMaxVotes(safeMaxVotes);
    setEditSubscriberWeight(draft.pesoMensalista === 'sim' ? 'sim' : 'nao');
    setEditDurationKey(normalizedDurationKey);
    setIsEditOpen(true);
  };

  const addEditOption = () => {
    if (editOptions.length >= 20) {
      toast.error('Limite de 20 opções por enquete');
      return;
    }

    setEditOptions((current) => [...current, { id: Date.now().toString(), text: '' }]);
  };

  const removeEditOption = (id: string) => {
    if (editOptions.length <= 2) {
      toast.error('A enquete precisa ter pelo menos 2 opções');
      return;
    }

    setEditOptions((current) => current.filter((option) => option.id !== id));
  };

  const updateEditOption = (id: string, value: string) => {
    setEditOptions((current) => current.map((option) => (option.id === id ? { ...option, text: value } : option)));
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;

    const normalizedOptions = editOptions.map((option) => option.text.trim()).filter(Boolean);

    if (!editTitle.trim()) {
      toast.error('Informe um título para o rascunho');
      return;
    }

    if (normalizedOptions.length < 2) {
      toast.error('A enquete precisa ter pelo menos 2 opções válidas');
      return;
    }

    const optionsLowerCase = normalizedOptions.map((option) => option.toLowerCase());
    const hasDuplicatedOptions = new Set(optionsLowerCase).size !== optionsLowerCase.length;
    if (hasDuplicatedOptions) {
      toast.error('As opções devem ser únicas');
      return;
    }

    setActionLoadingId(editingDraft.id);
    try {
      const result = await editDraft({
        id: editingDraft.id,
        title: editTitle.trim(),
        optionsCsv: normalizedOptions.join(', '),
        maxVotes: editMaxVotes,
        pesoMensalista: editSubscriberWeight,
        durationKey: editDurationKey,
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl mb-2 dark:text-white">Publicar Enquete</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie e publique enquetes a partir dos rascunhos disponíveis
            </p>
          </div>
          <Button className="bg-[#5865F2] hover:bg-[#4752C4] w-full sm:w-auto" onClick={() => navigate('/create')}>
            <Plus className="size-4 mr-2" />
            Criar Enquete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {loadingDrafts && (
          <Card className="p-8 md:p-12 text-center lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Carregando rascunhos...</p>
          </Card>
        )}

        {!loadingDrafts &&
          sortedDrafts.map((draft) => {
            const isActionLoading = actionLoadingId === draft.id;
            const serverName = draft.serverName || 'Servidor desconhecido';
            const channelName = draft.channelName || 'Canal desconhecido';
            const serverTooltip = `${serverName} (${draft.guildId || 'ID indisponível'})`;
            const channelTooltip = `${channelName} (${draft.channelId || 'ID indisponível'})`;

            return (
              <Card key={draft.id} className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="size-5 text-gray-400 dark:text-gray-500 shrink-0" />
                      <h3 className="text-base md:text-lg dark:text-white truncate">{draft.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="truncate">Origem: dashboard</span>
                      <span>•</span>
                      <span className="truncate">Autor: {draft.creatorName || 'Autor desconhecido'}</span>
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

                <div className="mb-4 rounded-md border border-[#5865F2]/30 p-3 dark:border-[#5865F2]/50">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#4752C4] dark:text-[#A8B1FF]">
                    Destino da publicação
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 min-w-0 rounded-md px-2 py-1">
                      <Server className="size-4 shrink-0 text-[#5865F2]" />
                      <span className="text-sm text-gray-800 dark:text-gray-100 truncate" title={serverTooltip}>
                        {serverName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 rounded-md px-2 py-1">
                      <Hash className="size-4 shrink-0 text-[#5865F2]" />
                      <span className="text-sm text-gray-800 dark:text-gray-100 truncate" title={channelTooltip}>
                        {channelName}
                      </span>
                    </div>
                  </div>
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
              onClick={() => navigate('/create')}
            >
              <Plus className="size-4 mr-2" />
              Criar Enquete
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden p-0 dark:bg-gray-800 dark:border-gray-700 sm:max-w-2xl">
          <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden p-6">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Editar Rascunho</DialogTitle>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
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
                <div className="flex items-center justify-between gap-2">
                  <Label className="dark:text-gray-200">Opções</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEditOption}
                    disabled={editOptions.length >= 20}
                    className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Plus className="size-4 mr-2" />
                    Adicionar opção
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {editOptions.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => updateEditOption(option.id, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEditOption(option.id)}
                        disabled={editOptions.length <= 2}
                        className="dark:hover:bg-gray-700 shrink-0"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Você pode editar as opções existentes e adicionar novas (mínimo 2, máximo 20).
                </p>
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

              <div>
                <Label htmlFor="edit-duration" className="dark:text-gray-200">
                  Duração
                </Label>
                <select
                  id="edit-duration"
                  value={editDurationKey}
                  onChange={(e) =>
                    setEditDurationKey((e.target.value as '1h' | '6h' | '12h' | '24h' | '3d' | '7d') || '24h')
                  }
                  className="mt-1 h-9 w-full rounded-md border border-gray-600 bg-gray-700 px-3 text-sm text-white"
                >
                  <option value="1h">1 hora</option>
                  <option value="6h">6 horas</option>
                  <option value="12h">12 horas</option>
                  <option value="24h">24 horas</option>
                  <option value="3d">3 dias</option>
                  <option value="7d">7 dias</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
