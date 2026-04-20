export interface DashboardPollOption {
  id: string;
  text: string;
  votes: number;
  emoji?: string | null;
}

export interface DashboardDraftOption {
  text: string;
  emoji?: string | null;
}

export interface DashboardGuildEmoji {
  id: string;
  name: string;
  animated: boolean;
  identifier: string;
}

export type DurationKey = '1h' | '6h' | '12h' | '24h' | '3d' | '7d';

export interface DashboardPoll {
  id: string;
  title: string;
  description: string;
  serverId?: string | null;
  serverName: string;
  channelId?: string | null;
  channelName: string;
  createdAt?: string | null;
  endsAt?: string | null;
  durationKey?: DurationKey | null;
  status: 'active' | 'ended';
  totalVotes: number;
  options: DashboardPollOption[];
  allowMultipleChoices: boolean;
  anonymous: boolean;
}

export interface DashboardGuild {
  id: string;
  name: string;
  icon?: string | null;
  isActive?: boolean;
  emojis?: DashboardGuildEmoji[];
}

export interface DashboardChannel {
  id: string;
  name: string;
  type?: number;
}

export interface DashboardMember {
  id: string;
  username: string;
  displayName: string;
}

export interface DashboardGroupMember {
  id: string;
  addedAt?: string | null;
  addedBy?: string | null;
}

export interface DashboardDraftContext {
  id: string;
  title: string;
  guildId?: string | null;
  channelId?: string | null;
  serverName?: string | null;
  channelName?: string | null;
  optionsCount: number;
  creatorId?: string | null;
  creatorName?: string | null;
  options?: Array<string | DashboardDraftOption>;
  maxVotes?: number;
  pesoMensalista?: 'sim' | 'nao';
  durationKey?: DurationKey;
  updatedAt?: string | null;
}

type CommandPayload = {
  commandType?: number;
  options?: Record<string, unknown>;
  guild?: {
    id?: string;
  };
  target?: {
    channelId?: string;
    [key: string]: unknown;
  };
  dashboardSource?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
} & T;

type RequestJsonOptions = {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
};

async function requestJson<T>(path: string, options: RequestJsonOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body } = options;

  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Não foi possível carregar os dados do dashboard');
  }

  if (payload?.success === false) {
    throw new Error(payload.error || payload.message || 'Não foi possível carregar os dados do dashboard');
  }

  return payload || ({} as ApiResponse<T>);
}

export async function getPollHistory() {
  const payload = await requestJson<{ polls: DashboardPoll[] }>('/polls/history');
  return Array.isArray(payload.polls) ? payload.polls : [];
}

export async function getPollDetail(pollId: string) {
  const payload = await requestJson<{ poll: DashboardPoll }>(`/polls/${encodeURIComponent(pollId)}`);
  return payload.poll;
}

export async function getGuilds() {
  const payload = await requestJson<{ guilds: DashboardGuild[] }>('/auth/guilds');
  return Array.isArray(payload.guilds) ? payload.guilds : [];
}

export async function getGuildChannels(guildId: string) {
  const payload = await requestJson<{ channels: DashboardChannel[] }>(
    `/auth/guilds/${encodeURIComponent(guildId)}/channels`,
  );
  return Array.isArray(payload.channels) ? payload.channels : [];
}

export async function getGuildEmojis(guildId: string) {
  const payload = await requestJson<{ emojis: DashboardGuildEmoji[] }>(
    `/auth/guilds/${encodeURIComponent(guildId)}/emojis`,
  );
  return Array.isArray(payload.emojis) ? payload.emojis : [];
}

export async function getGuildMembers(guildId: string, query = '') {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set('query', query.trim());
  }

  const payload = await requestJson<{ members: DashboardMember[] }>(
    `/auth/guilds/${encodeURIComponent(guildId)}/members?${params.toString()}`,
  );

  return Array.isArray(payload.members) ? payload.members : [];
}

export async function getGroupMemberIds(guildId: string, group: 'mensalistas' | 'criadores') {
  const params = new URLSearchParams({ group });
  const payload = await requestJson<{ ids: string[]; members?: DashboardGroupMember[] }>(
    `/auth/guilds/${encodeURIComponent(guildId)}/group-members?${params.toString()}`,
  );

  if (Array.isArray(payload.ids)) return payload.ids;
  return Array.isArray(payload.members) ? payload.members.map((member) => member.id) : [];
}

export async function getGroupMembers(guildId: string, group: 'mensalistas' | 'criadores') {
  const params = new URLSearchParams({ group });
  const payload = await requestJson<{ ids: string[]; members?: DashboardGroupMember[] }>(
    `/auth/guilds/${encodeURIComponent(guildId)}/group-members?${params.toString()}`,
  );

  if (Array.isArray(payload.members)) return payload.members;
  return Array.isArray(payload.ids) ? payload.ids.map((id) => ({ id, addedAt: null, addedBy: null })) : [];
}

export async function getDraftContextTargets() {
  const payload = await requestJson<{ drafts: DashboardDraftContext[] }>('/commands/context-targets/drafts');
  return Array.isArray(payload.drafts) ? payload.drafts : [];
}

export async function executeDashboardCommand(commandName: string, payload: CommandPayload) {
  return requestJson<{}>(`/commands/${encodeURIComponent(commandName)}`, {
    method: 'POST',
    body: payload,
  });
}

export async function createDraft(payload: {
  guildId: string;
  channelId: string;
  title: string;
  options: DashboardDraftOption[];
  maxVotes: number;
  pesoMensalista: 'sim' | 'nao';
  durationKey?: DurationKey;
  dashboardSource?: string;
}) {
  return executeDashboardCommand('rascunho', {
    commandType: 1,
    guild: { id: payload.guildId },
    target: { channelId: payload.channelId },
    dashboardSource: payload.dashboardSource || 'dashboard-create',
    options: {
      subcommand: 'criar',
      values: {
        titulo: payload.title,
        opcoes: JSON.stringify(payload.options),
        max_votos: payload.maxVotes,
        peso_mensalista: payload.pesoMensalista,
        duracao: payload.durationKey || '24h',
      },
    },
  });
}

export async function editDraft(payload: {
  id: string;
  title?: string;
  options?: DashboardDraftOption[];
  maxVotes?: number;
  pesoMensalista?: 'sim' | 'nao';
  durationKey?: DurationKey;
  dashboardSource?: string;
}) {
  const values: Record<string, unknown> = { id: payload.id };
  if (payload.title) values.titulo = payload.title;
  if (payload.options) values.opcoes = JSON.stringify(payload.options);
  if (typeof payload.maxVotes === 'number') values.max_votos = payload.maxVotes;
  if (payload.pesoMensalista) values.peso_mensalista = payload.pesoMensalista;
  if (payload.durationKey) values.duracao = payload.durationKey;

  return executeDashboardCommand('rascunho', {
    commandType: 1,
    dashboardSource: payload.dashboardSource || 'dashboard-drafts',
    options: {
      subcommand: 'editar',
      values,
    },
  });
}

export async function publishDraft(payload: { id: string; guildId: string; channelId: string }) {
  return executeDashboardCommand('rascunho', {
    commandType: 1,
    guild: { id: payload.guildId },
    target: { channelId: payload.channelId },
    dashboardSource: 'dashboard-drafts',
    options: {
      subcommand: 'publicar',
      values: {
        id: payload.id,
      },
    },
  });
}

export async function deleteDraft(id: string) {
  return executeDashboardCommand('rascunho', {
    commandType: 1,
    options: {
      subcommand: 'deletar',
      values: {
        id,
      },
    },
  });
}

export async function closePoll(payload: { pollId: string; guildId?: string | null; channelId?: string | null }) {
  return executeDashboardCommand('Encerrar Votação', {
    commandType: 3,
    guild: payload.guildId ? { id: payload.guildId } : undefined,
    target: {
      channelId: payload.channelId || undefined,
      messageId: payload.pollId,
    },
  });
}

async function resolveCommandChannelId(guildId: string) {
  const channels = await getGuildChannels(guildId);
  const textChannel = channels.find((channel) => channel.type !== 2 && channel.type !== 13);

  if (!textChannel) {
    throw new Error('Nenhum canal de texto disponível para executar o comando no servidor selecionado');
  }

  return textChannel.id;
}

export async function addModerator(guildId: string, userId: string) {
  const channelId = await resolveCommandChannelId(guildId);

  return executeDashboardCommand('criador-de-enquete', {
    commandType: 1,
    guild: { id: guildId },
    target: { channelId },
    options: {
      subcommand: 'adicionar',
      values: {
        usuario: userId,
      },
    },
  });
}

export async function removeModerator(guildId: string, userId: string) {
  const channelId = await resolveCommandChannelId(guildId);

  return executeDashboardCommand('criador-de-enquete', {
    commandType: 1,
    guild: { id: guildId },
    target: { channelId },
    options: {
      subcommand: 'remover',
      values: {
        usuario: userId,
      },
    },
  });
}

export async function addSubscriber(guildId: string, userId: string) {
  const channelId = await resolveCommandChannelId(guildId);

  return executeDashboardCommand('mensalista', {
    commandType: 1,
    guild: { id: guildId },
    target: { channelId },
    options: {
      subcommand: 'adicionar',
      values: {
        usuario: userId,
      },
    },
  });
}

export async function removeSubscriber(guildId: string, userId: string) {
  const channelId = await resolveCommandChannelId(guildId);

  return executeDashboardCommand('mensalista', {
    commandType: 1,
    guild: { id: guildId },
    target: { channelId },
    options: {
      subcommand: 'remover',
      values: {
        usuario: userId,
      },
    },
  });
}
