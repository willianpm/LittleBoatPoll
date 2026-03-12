const API_BASE = '/api';

async function parseApiResponse(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  if (payload && payload.success === false) {
    throw new Error(payload.error || 'Não foi possível concluir a operação.');
  }

  return payload;
}

export async function getCurrentSession() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResponse(response);
}

export async function getGuilds() {
  const response = await fetch(`${API_BASE}/auth/guilds`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResponse(response);
}

export async function getGuildMembers(guildId, query = '') {
  const params = new URLSearchParams();
  if (query) params.set('query', query);

  const response = await fetch(`${API_BASE}/auth/guilds/${encodeURIComponent(guildId)}/members?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResponse(response);
}

export async function getGuildChannels(guildId) {
  const response = await fetch(`${API_BASE}/auth/guilds/${encodeURIComponent(guildId)}/channels`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResponse(response);
}

export async function getCommandCatalog() {
  const response = await fetch(`${API_BASE}/commands/catalog`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResponse(response);
}

export async function getPollContextTargets(guildId) {
  const params = new URLSearchParams();
  if (guildId) params.set('guildId', guildId);

  const response = await fetch(`${API_BASE}/commands/context-targets/polls?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResponse(response);
}

export async function getDraftContextTargets() {
  const response = await fetch(`${API_BASE}/commands/context-targets/drafts`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResponse(response);
}

export async function logoutSession() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return parseApiResponse(response);
}

export async function uploadCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/csv/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  return parseApiResponse(response);
}

export async function executeCommand({ commandName, commandType, options, guildId, target }) {
  const response = await fetch(`${API_BASE}/commands/${encodeURIComponent(commandName)}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      commandType,
      options,
      guild: guildId ? { id: guildId } : undefined,
      target,
    }),
  });

  return parseApiResponse(response);
}
