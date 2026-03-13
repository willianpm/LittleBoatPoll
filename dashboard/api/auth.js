const crypto = require('crypto');
const express = require('express');
const { client } = require('../../src/core/client');
const { isCriador } = require('../../src/utils/permissions');

const router = express.Router();

const DISCORD_API_BASE = 'https://discord.com/api';
const DEFAULT_SCOPES = ['identify'];

function getOAuthConfig() {
  return {
    clientId: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_OAUTH_REDIRECT_URI || '',
  };
}

function getMissingOAuthKeys() {
  const config = getOAuthConfig();
  const missing = [];

  if (!config.clientId) {
    missing.push('DISCORD_CLIENT_ID (ou CLIENT_ID)');
  }
  if (!config.clientSecret) {
    missing.push('DISCORD_CLIENT_SECRET');
  }
  if (!config.redirectUri) {
    missing.push('DISCORD_OAUTH_REDIRECT_URI');
  }

  return missing;
}

function buildAuthRedirect(status) {
  const frontendUrl = process.env.DASHBOARD_FRONTEND_URL;

  if (frontendUrl) {
    try {
      const redirectUrl = new URL(frontendUrl);
      if (status) {
        redirectUrl.searchParams.set('auth', status);
      }

      return redirectUrl.toString();
    } catch {
      // fallback para rota local
    }
  }

  if (!status) {
    return '/';
  }

  return `/?auth=${status}`;
}

function buildDiscordOAuthUrl(state) {
  const oauthConfig = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    response_type: 'code',
    scope: DEFAULT_SCOPES.join(' '),
    state,
    prompt: 'consent',
  });

  return `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
}

function persistSession(req) {
  if (!req?.session || typeof req.session.save !== 'function') {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function exchangeCodeForToken(code) {
  const oauthConfig = getOAuthConfig();
  const body = new URLSearchParams({
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: oauthConfig.redirectUri,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Falha ao trocar code por token Discord: ${response.status} ${payload}`);
  }

  return response.json();
}

async function fetchDiscordUser(accessToken) {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Falha ao obter perfil Discord: ${response.status} ${payload}`);
  }

  return response.json();
}

function getDashboardGuildId() {
  return process.env.DASHBOARD_ALLOWED_GUILD_ID || null;
}

function getDiscordAvatarUrl(user) {
  if (!user?.id || !user?.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}

function getDiscordGuildIconUrl(guild) {
  if (!guild?.id || !guild?.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
}

async function resolveAuthorizedMember(userId, preferredGuildId = null) {
  const candidateGuildIds = [];
  if (preferredGuildId) candidateGuildIds.push(preferredGuildId);

  for (const guild of client.guilds.cache.values()) {
    if (!candidateGuildIds.includes(guild.id)) {
      candidateGuildIds.push(guild.id);
    }
  }

  for (const guildId of candidateGuildIds) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const member = guild.members.cache.get(userId) || (await guild.members.fetch(userId).catch(() => null));
    if (!member) continue;

    if (isCriador(member, guild.id)) {
      return { guildId: guild.id, member };
    }
  }

  return null;
}

async function getAccessibleGuildEntries(userId) {
  const entries = [];

  for (const guild of client.guilds.cache.values()) {
    const member = guild.members.cache.get(userId) || (await guild.members.fetch(userId).catch(() => null));
    if (!member) continue;

    if (isCriador(member, guild.id)) {
      entries.push({ guild, member });
    }
  }

  return entries;
}

function getDashboardSession(req) {
  return req?.session?.dashboardAuth || null;
}

function isValidDashboardToken(reqOrToken) {
  if (typeof reqOrToken === 'string') {
    return false;
  }

  const sessionData = getDashboardSession(reqOrToken);
  return Boolean(sessionData && sessionData.userId && sessionData.guildId);
}

async function refreshDashboardAccess(req) {
  const sessionData = getDashboardSession(req);
  if (!sessionData) {
    return { ok: false, code: 401, error: 'Não autenticado' };
  }

  const accessibleGuilds = await getAccessibleGuildEntries(sessionData.userId);
  if (accessibleGuilds.length === 0) {
    return { ok: false, code: 403, error: 'Usuário autenticado sem permissão para dashboard' };
  }

  const resolved =
    accessibleGuilds.find((entry) => entry.guild.id === sessionData.guildId) ||
    accessibleGuilds.find((entry) => entry.guild.id === getDashboardGuildId()) ||
    accessibleGuilds[0];

  req.dashboardAuth = {
    ...sessionData,
    guildId: resolved.guild.id,
    member: resolved.member,
    accessibleGuildIds: accessibleGuilds.map((entry) => entry.guild.id),
  };
  req.session.dashboardAuth.guildId = resolved.guild.id;

  return { ok: true };
}

async function validateDashboardToken(req, res, next) {
  const result = await refreshDashboardAccess(req);
  if (!result.ok) {
    return res.status(result.code).json({ error: result.error });
  }

  return next();
}

router.get('/discord/login', async (req, res) => {
  const missingKeys = getMissingOAuthKeys();
  if (missingKeys.length > 0) {
    return res.status(500).json({
      error: 'OAuth Discord não configurado no servidor',
      missing: missingKeys,
    });
  }

  const state = crypto.randomBytes(24).toString('hex');
  req.session.discordOauthState = state;

  try {
    await persistSession(req);
  } catch (error) {
    console.error('[dashboard-auth] erro ao persistir sessão antes do login OAuth:', error.message);
    return res.status(500).json({ error: 'Não foi possível iniciar o login com Discord' });
  }

  return res.redirect(buildDiscordOAuthUrl(state));
});

router.get('/discord/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state || state !== req.session.discordOauthState) {
      return res.redirect(buildAuthRedirect('invalid_state'));
    }

    const tokenData = await exchangeCodeForToken(String(code));
    const discordUser = await fetchDiscordUser(tokenData.access_token);

    const preferredGuildId = getDashboardGuildId();
    const resolved = await resolveAuthorizedMember(discordUser.id, preferredGuildId);

    if (!resolved) {
      req.session.dashboardAuth = null;
      req.session.discordOauthState = null;
      await persistSession(req);
      return res.redirect(buildAuthRedirect('forbidden'));
    }

    req.session.dashboardAuth = {
      userId: discordUser.id,
      username: discordUser.username,
      avatar: getDiscordAvatarUrl(discordUser),
      guildId: resolved.guildId,
      loggedAt: new Date().toISOString(),
    };
    req.session.discordOauthState = null;

    await persistSession(req);

    return res.redirect(buildAuthRedirect());
  } catch (error) {
    console.error('[dashboard-auth] erro no callback OAuth:', error.message);
    return res.redirect(buildAuthRedirect('error'));
  }
});

router.get('/me', async (req, res) => {
  const result = await refreshDashboardAccess(req);
  if (!result.ok) {
    return res.status(result.code).json({ error: result.error, authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: {
      id: req.dashboardAuth.userId,
      username: req.dashboardAuth.username,
      avatar: req.dashboardAuth.avatar,
      guildId: req.dashboardAuth.guildId,
    },
  });
});

router.get('/guilds', validateDashboardToken, async (req, res) => {
  try {
    const guilds = Array.from(client.guilds.cache.values())
      .filter((guild) => req.dashboardAuth.accessibleGuildIds.includes(guild.id))
      .map((guild) => ({
        id: guild.id,
        name: guild.name,
        icon: getDiscordGuildIconUrl(guild),
        isActive: guild.id === req.dashboardAuth.guildId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return res.json({ guilds });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/guilds/:guildId/members', validateDashboardToken, async (req, res) => {
  try {
    const { guildId } = req.params;
    const query = String(req.query.query || '')
      .trim()
      .toLowerCase();

    if (!req.dashboardAuth.accessibleGuildIds.includes(guildId)) {
      return res.status(403).json({ error: 'Acesso negado para a guild informada' });
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild não encontrada' });
    }

    await guild.members.fetch().catch(() => null);

    const members = Array.from(guild.members.cache.values())
      .filter((member) => !member.user?.bot)
      .filter((member) => {
        if (!query) return true;
        const username = member.user?.username?.toLowerCase() || '';
        const displayName = member.displayName?.toLowerCase() || '';
        return username.includes(query) || displayName.includes(query);
      })
      .slice(0, 100)
      .map((member) => ({
        id: member.user.id,
        username: member.user.username,
        displayName: member.displayName || member.user.username,
      }));

    return res.json({ members });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/guilds/:guildId/channels', validateDashboardToken, async (req, res) => {
  try {
    const { guildId } = req.params;

    if (!req.dashboardAuth.accessibleGuildIds.includes(guildId)) {
      return res.status(403).json({ error: 'Acesso negado para a guild informada' });
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild não encontrada' });
    }

    await guild.channels.fetch().catch(() => null);

    const channels = Array.from(guild.channels.cache.values())
      .filter(
        (channel) =>
          channel && typeof channel.isTextBased === 'function' && channel.isTextBased() && !channel.isVoiceBased?.(),
      )
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return res.json({ channels });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('dashboard.sid');
    res.status(200).json({ success: true });
  });
});

module.exports = {
  authRouter: router,
  validateDashboardToken,
  isValidDashboardToken,
  refreshDashboardAccess,
};
