import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { UserPlus, Trash2, Shield, Star, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  addModerator,
  addSubscriber,
  getGroupMembers,
  getGuildMembers,
  getGuilds,
  removeModerator,
  removeSubscriber,
  type DashboardGuild,
  type DashboardMember,
} from '../lib/dashboard-api';

type User = {
  id: string;
  username: string;
  displayName: string;
  addedAt?: string;
  addedBy?: string;
};

export function Moderation() {
  const [guilds, setGuilds] = useState<DashboardGuild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [moderatorMembers, setModeratorMembers] = useState<User[]>([]);
  const [subscriberMembers, setSubscriberMembers] = useState<User[]>([]);
  const [moderatorIds, setModeratorIds] = useState<string[]>([]);
  const [subscriberIds, setSubscriberIds] = useState<string[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isGuildDataLoading, setIsGuildDataLoading] = useState(false);
  const [modInput, setModInput] = useState('');
  const [subInput, setSubInput] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setIsBootstrapping(true);
      try {
        const guildData = await getGuilds();
        if (!isMounted) return;

        setGuilds(guildData);
        const activeGuild = guildData.find((guild) => guild.isActive) || guildData[0];
        setSelectedGuildId(activeGuild?.id || '');
      } catch (error) {
        if (!isMounted) return;
        toast.error(error instanceof Error ? error.message : 'Falha ao carregar servidores');
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadGuildModerationData() {
      if (!selectedGuildId) {
        setMembers([]);
        setModeratorMembers([]);
        setSubscriberMembers([]);
        setModeratorIds([]);
        setSubscriberIds([]);
        setIsGuildDataLoading(false);
        return;
      }

      setIsGuildDataLoading(true);
      try {
        const [memberData, loadedModerators, loadedSubscribers] = await Promise.all([
          getGuildMembers(selectedGuildId),
          getGroupMembers(selectedGuildId, 'criadores'),
          getGroupMembers(selectedGuildId, 'mensalistas'),
        ]);

        if (!isMounted) return;

        setMembers(memberData);
        setModeratorMembers(
          loadedModerators.map((entry) => {
            const member = memberData.find((currentMember) => currentMember.id === entry.id);
            return {
              id: entry.id,
              username: member?.username || entry.id,
              displayName: member?.displayName || member?.username || entry.id,
              addedAt: entry.addedAt || undefined,
              addedBy: entry.addedBy || undefined,
            };
          }),
        );
        setSubscriberMembers(
          loadedSubscribers.map((entry) => {
            const member = memberData.find((currentMember) => currentMember.id === entry.id);
            return {
              id: entry.id,
              username: member?.username || entry.id,
              displayName: member?.displayName || member?.username || entry.id,
              addedAt: entry.addedAt || undefined,
              addedBy: entry.addedBy || undefined,
            };
          }),
        );
        setModeratorIds(loadedModerators.map((entry) => entry.id));
        setSubscriberIds(loadedSubscribers.map((entry) => entry.id));
      } catch (error) {
        if (!isMounted) return;
        toast.error(error instanceof Error ? error.message : 'Falha ao carregar dados de moderação');
        setMembers([]);
        setModeratorIds([]);
        setSubscriberIds([]);
      } finally {
        if (isMounted) {
          setIsGuildDataLoading(false);
        }
      }
    }

    loadGuildModerationData();

    return () => {
      isMounted = false;
    };
  }, [selectedGuildId]);

  const memberById = useMemo(() => {
    const map = new Map<string, DashboardMember>();
    members.forEach((member) => {
      map.set(member.id, member);
    });
    return map;
  }, [members]);

  const moderators = useMemo<User[]>(() => {
    return moderatorMembers.map((member) => ({
      ...member,
      username: member.username || memberById.get(member.id)?.username || member.id,
      displayName: member.displayName || memberById.get(member.id)?.displayName || member.id,
    }));
  }, [moderatorMembers, memberById]);

  const subscribers = useMemo<User[]>(() => {
    return subscriberMembers.map((member) => ({
      ...member,
      username: member.username || memberById.get(member.id)?.username || member.id,
      displayName: member.displayName || memberById.get(member.id)?.displayName || member.id,
    }));
  }, [subscriberMembers, memberById]);

  const availableMembersForModerators = useMemo(
    () => members.filter((member) => !moderatorIds.includes(member.id)),
    [members, moderatorIds],
  );

  const availableMembersForSubscribers = useMemo(
    () => members.filter((member) => !subscriberIds.includes(member.id)),
    [members, subscriberIds],
  );

  async function refreshGroups() {
    if (!selectedGuildId) return;

    setIsGuildDataLoading(true);
    try {
      const [loadedModerators, loadedSubscribers] = await Promise.all([
        getGroupMembers(selectedGuildId, 'criadores'),
        getGroupMembers(selectedGuildId, 'mensalistas'),
      ]);

      setModeratorMembers(
        loadedModerators.map((entry) => {
          const member = members.find((currentMember) => currentMember.id === entry.id);
          return {
            id: entry.id,
            username: member?.username || entry.id,
            displayName: member?.displayName || member?.username || entry.id,
            addedAt: entry.addedAt || undefined,
            addedBy: entry.addedBy || undefined,
          };
        }),
      );
      setSubscriberMembers(
        loadedSubscribers.map((entry) => {
          const member = members.find((currentMember) => currentMember.id === entry.id);
          return {
            id: entry.id,
            username: member?.username || entry.id,
            displayName: member?.displayName || member?.username || entry.id,
            addedAt: entry.addedAt || undefined,
            addedBy: entry.addedBy || undefined,
          };
        }),
      );
      setModeratorIds(loadedModerators.map((entry) => entry.id));
      setSubscriberIds(loadedSubscribers.map((entry) => entry.id));
    } finally {
      setIsGuildDataLoading(false);
    }
  }

  function resolveUserId(inputValue: string, availableMembers: DashboardMember[]) {
    const normalized = inputValue.trim().toLowerCase();
    if (!normalized) return null;

    const byId = availableMembers.find((member) => member.id === inputValue.trim());
    if (byId) return byId.id;

    const byExactName = availableMembers.find(
      (member) => member.username.toLowerCase() === normalized || member.displayName.toLowerCase() === normalized,
    );

    return byExactName?.id || null;
  }

  const formatDate = (date: string) => {
    if (!date) return 'Sem data';

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'Sem data';

    return parsedDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resolveAddedByDisplay = (addedBy?: string) => {
    if (!addedBy) return 'desconhecido';

    const member = memberById.get(addedBy);
    if (!member) return addedBy;

    return member.displayName || member.username || addedBy;
  };

  const formatAddedMetadata = (user: User) => {
    if (!user.addedAt && !user.addedBy) return 'Sem informações de autoria';
    return `Adicionado por ${resolveAddedByDisplay(user.addedBy)} em ${formatDate(user.addedAt || '')}`;
  };

  const isLoading = isBootstrapping || isGuildDataLoading;

  const handleRemoveModerator = async (id: string) => {
    if (!selectedGuildId) {
      toast.error('Selecione um servidor');
      return;
    }

    try {
      const result = await removeModerator(selectedGuildId, id);
      toast.success(typeof result.message === 'string' ? result.message : 'Moderador removido com sucesso!');
      await refreshGroups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao remover moderador');
    }
  };

  const handleRemoveSubscriber = async (id: string) => {
    if (!selectedGuildId) {
      toast.error('Selecione um servidor');
      return;
    }

    try {
      const result = await removeSubscriber(selectedGuildId, id);
      toast.success(typeof result.message === 'string' ? result.message : 'Mensalista removido com sucesso!');
      await refreshGroups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao remover mensalista');
    }
  };

  const handleAddModerator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGuildId) {
      toast.error('Selecione um servidor');
      return;
    }

    const userId = resolveUserId(modInput, availableMembersForModerators);
    if (!userId) {
      toast.error('Usuário inválido. Use o ID ou nome exato de um membro disponível.');
      return;
    }

    try {
      const result = await addModerator(selectedGuildId, userId);
      toast.success(typeof result.message === 'string' ? result.message : 'Moderador adicionado com sucesso!');
      setModInput('');
      await refreshGroups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao adicionar moderador');
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGuildId) {
      toast.error('Selecione um servidor');
      return;
    }

    const userId = resolveUserId(subInput, availableMembersForSubscribers);
    if (!userId) {
      toast.error('Usuário inválido. Use o ID ou nome exato de um membro disponível.');
      return;
    }

    try {
      const result = await addSubscriber(selectedGuildId, userId);
      toast.success(typeof result.message === 'string' ? result.message : 'Mensalista adicionado com sucesso!');
      setSubInput('');
      await refreshGroups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao adicionar mensalista');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl mb-2 dark:text-white">Moderação</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie moderadores e mensalistas do bot</p>
        <div className="mt-4 max-w-md">
          <Label htmlFor="moderation-guild" className="dark:text-gray-200">
            Servidor
          </Label>
          <select
            id="moderation-guild"
            value={selectedGuildId}
            onChange={(event) => setSelectedGuildId(event.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            disabled={guilds.length === 0}
          >
            <option value="">Selecione um servidor</option>
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="moderators" className="w-full">
        <TabsList className="mb-6 w-full grid grid-cols-2 gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg h-auto">
          <TabsTrigger
            value="moderators"
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all border-2
                       data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:border-transparent
                       data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5865F2] data-[state=active]:to-[#4752C4] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-[#5865F2]"
          >
            <Shield className="size-5" />
            <span>Moderadores ({moderators.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="subscribers"
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all
                       data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400
                       data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Star className="size-5" />
            <span>Mensalistas ({subscribers.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="moderators"
          className="min-h-[30rem] md:min-h-[34rem] transition-opacity duration-200 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                <div className="mb-4 md:mb-6 h-6 w-56 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700" />
                <div className="space-y-3 min-h-[18rem]">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-10 rounded-full bg-gray-200 animate-pulse dark:bg-gray-600 shrink-0" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse dark:bg-gray-600" />
                          <div className="h-3 w-56 rounded bg-gray-200 animate-pulse dark:bg-gray-600" />
                        </div>
                      </div>
                      <div className="size-8 rounded-md bg-gray-200 animate-pulse dark:bg-gray-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="h-6 w-44 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700" />
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-36 rounded bg-gray-200 animate-pulse dark:bg-gray-600" />
                    <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse dark:bg-gray-600" />
                    <div className="h-3 w-52 rounded bg-gray-200 animate-pulse dark:bg-gray-600" />
                  </div>
                  <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse dark:bg-gray-600" />
                  <div className="h-20 w-full rounded-md bg-gray-200 animate-pulse dark:bg-gray-700" />
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2">
                  <h2 className="text-lg md:text-xl dark:text-white">Lista de Moderadores</h2>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {moderators.length} moderador{moderators.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                <div className="space-y-3 min-h-[18rem]">
                  {moderators.map((mod) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-100 shrink-0">
                          {mod.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate dark:text-white">{mod.displayName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="size-3" />
                            <span className="truncate">{formatAddedMetadata(mod)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveModerator(mod.id)}
                        className="shrink-0 dark:hover:bg-gray-600"
                      >
                        <Trash2 className="size-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  ))}

                  {moderators.length === 0 && (
                    <div className="text-center py-8 md:py-12 text-gray-600 dark:text-gray-400">
                      Nenhum moderador cadastrado
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-lg md:text-xl mb-4 md:mb-6 dark:text-white">Adicionar Moderador</h2>

                <form onSubmit={handleAddModerator} className="space-y-4">
                  <div>
                    <Label htmlFor="modUsername" className="dark:text-gray-200">
                      Nome de Usuário ou ID
                    </Label>
                    <Input
                      id="modUsername"
                      list="members-for-moderators"
                      placeholder="username ou ID do Discord"
                      required
                      value={modInput}
                      onChange={(e) => setModInput(e.target.value)}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <datalist id="members-for-moderators">
                      {availableMembersForModerators.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName} ({member.username})
                        </option>
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Use o ID de um membro ou nome exato sugerido
                    </p>
                  </div>

                  <Button type="submit" className="w-full bg-[#5865F2] hover:bg-[#4752C4]" disabled={!selectedGuildId}>
                    <UserPlus className="size-4 mr-2" />
                    Adicionar Moderador
                  </Button>
                </form>

                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    <strong>Permissões:</strong> Moderadores podem criar, editar e gerenciar enquetes em todos os
                    servidores.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="subscribers"
          className="min-h-[30rem] md:min-h-[34rem] transition-opacity duration-200 data-[state=inactive]:opacity-0 data-[state=active]:opacity-100"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                <div className="mb-4 md:mb-6 h-6 w-52 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700" />
                <div className="space-y-3 min-h-[18rem]">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-yellow-200 dark:border-yellow-700/50 gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-10 rounded-full bg-yellow-100 animate-pulse dark:bg-yellow-700/70 shrink-0" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-4 w-32 rounded bg-yellow-100 animate-pulse dark:bg-yellow-700/70" />
                          <div className="h-3 w-56 rounded bg-yellow-100 animate-pulse dark:bg-yellow-700/70" />
                        </div>
                      </div>
                      <div className="size-8 rounded-md bg-yellow-100 animate-pulse dark:bg-yellow-700/70 shrink-0" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="h-6 w-44 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700" />
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-36 rounded bg-gray-200 animate-pulse dark:bg-gray-600" />
                    <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse dark:bg-gray-600" />
                    <div className="h-3 w-52 rounded bg-gray-200 animate-pulse dark:bg-gray-600" />
                  </div>
                  <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse dark:bg-gray-600" />
                  <div className="h-20 w-full rounded-md bg-gray-200 animate-pulse dark:bg-gray-700" />
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2">
                  <h2 className="text-lg md:text-xl dark:text-white">Lista de Mensalistas</h2>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {subscribers.length} mensalista{subscribers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3 min-h-[18rem]">
                  {subscribers.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700/50 gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-full bg-yellow-200 text-sm font-semibold text-yellow-900 dark:bg-yellow-700 dark:text-white shrink-0">
                          {sub.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate dark:text-white">{sub.displayName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="size-3" />
                            <span className="truncate">{formatAddedMetadata(sub)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubscriber(sub.id)}
                        className="shrink-0 dark:hover:bg-gray-600"
                      >
                        <Trash2 className="size-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  ))}

                  {subscribers.length === 0 && (
                    <div className="text-center py-8 md:py-12 text-gray-600 dark:text-gray-400">
                      Nenhum mensalista cadastrado
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-lg md:text-xl mb-4 md:mb-6 dark:text-white">Adicionar Mensalista</h2>

                <form onSubmit={handleAddSubscriber} className="space-y-4">
                  <div>
                    <Label htmlFor="subUsername" className="dark:text-gray-200">
                      Nome de Usuário ou ID
                    </Label>
                    <Input
                      id="subUsername"
                      list="members-for-subscribers"
                      placeholder="username ou ID do Discord"
                      required
                      value={subInput}
                      onChange={(e) => setSubInput(e.target.value)}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <datalist id="members-for-subscribers">
                      {availableMembersForSubscribers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName} ({member.username})
                        </option>
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Use o ID de um membro ou nome exato sugerido
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    disabled={!selectedGuildId}
                  >
                    <UserPlus className="size-4 mr-2" />
                    Adicionar Mensalista
                  </Button>
                </form>

                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700/50">
                  <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    <strong>Benefícios:</strong> Mensalistas têm peso dois nas enquetes.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
