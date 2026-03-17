const request = require('supertest');
const express = require('express');

jest.mock('../../src/core/client', () => ({
  client: {
    guilds: { cache: new Map() },
  },
}));

jest.mock('../../src/utils/permissions', () => ({
  isCriador: jest.fn(() => true),
}));

jest.mock('../../src/utils/file-handler', () => ({
  loadMensalistas: jest.fn(() => ({ mensalistas: [] })),
  loadCriadores: jest.fn(() => ({ criadores: [] })),
}));

const { client } = require('../../src/core/client');
const { authRouter } = require('../api/auth');

describe('Dashboard Auth API - guild selectors', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.session = {
        dashboardAuth: {
          userId: 'user-1',
          username: 'tester',
          guildId: 'guild-1',
          avatar: null,
        },
      };
      next();
    });
    app.use('/api/auth', authRouter);
  });

  beforeEach(() => {
    const membersCache = new Map([
      [
        'user-1',
        {
          user: { id: 'user-1', username: 'tester', bot: false },
          displayName: 'Tester',
        },
      ],
      [
        'user-2',
        {
          user: { id: 'user-2', username: 'booklover', bot: false },
          displayName: 'Book Lover',
        },
      ],
    ]);

    const channelsCache = new Map([
      [
        'channel-1',
        {
          id: 'channel-1',
          name: 'geral',
          type: 0,
          isTextBased: () => true,
        },
      ],
    ]);

    client.guilds.cache = new Map([
      [
        'guild-1',
        {
          id: 'guild-1',
          name: 'Guild One',
          icon: null,
          members: {
            cache: membersCache,
            fetch: jest.fn(async () => membersCache),
          },
          channels: {
            cache: channelsCache,
            fetch: jest.fn(async () => channelsCache),
          },
        },
      ],
      [
        'guild-2',
        {
          id: 'guild-2',
          name: 'Guild Two',
          icon: null,
          members: {
            cache: membersCache,
            fetch: jest.fn(async () => membersCache),
          },
          channels: {
            cache: channelsCache,
            fetch: jest.fn(async () => channelsCache),
          },
        },
      ],
    ]);
  });

  it('should return guild list for authenticated user', async () => {
    const res = await request(app).get('/api/auth/guilds');
    expect(res.statusCode).toBe(200);
    expect(res.body.guilds).toHaveLength(2);
    expect(res.body.guilds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'guild-1',
          name: 'Guild One',
          isActive: true,
        }),
        expect.objectContaining({
          id: 'guild-2',
          name: 'Guild Two',
          isActive: false,
        }),
      ]),
    );
    expect(res.body.guilds.find((item) => item.id === 'guild-1')).toEqual(
      expect.objectContaining({
        id: 'guild-1',
        name: 'Guild One',
      }),
    );
  });

  it('should return members list for selected guild', async () => {
    const res = await request(app).get('/api/auth/guilds/guild-1/members?query=book');
    expect(res.statusCode).toBe(200);
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].id).toBe('user-2');
  });

  it('should return channels list for selected guild', async () => {
    const res = await request(app).get('/api/auth/guilds/guild-1/channels');
    expect(res.statusCode).toBe(200);
    expect(res.body.channels).toEqual([
      expect.objectContaining({
        id: 'channel-1',
        name: 'geral',
      }),
    ]);
  });
});

describe('Dashboard Auth API - group members', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.session = {
        dashboardAuth: {
          userId: 'user-1',
          username: 'tester',
          guildId: 'guild-1',
          avatar: null,
        },
      };
      next();
    });
    app.use('/api/auth', authRouter);
  });

  beforeEach(() => {
    const memberCache = new Map([
      ['user-1', { user: { id: 'user-1', username: 'tester', bot: false }, displayName: 'Tester' }],
    ]);
    client.guilds.cache = new Map([
      [
        'guild-1',
        {
          id: 'guild-1',
          name: 'Guild One',
          icon: null,
          members: { cache: memberCache, fetch: jest.fn(async () => memberCache) },
          channels: { cache: new Map(), fetch: jest.fn(async () => new Map()) },
        },
      ],
    ]);
  });

  it('should return mensalista ids for valid guild', async () => {
    const { loadMensalistas } = require('../../src/utils/file-handler');
    loadMensalistas.mockReturnValueOnce({ mensalistas: ['user-1', 'user-2'] });

    const res = await request(app).get('/api/auth/guilds/guild-1/group-members?group=mensalistas');
    expect(res.statusCode).toBe(200);
    expect(res.body.ids).toEqual(['user-1', 'user-2']);
  });

  it('should return criador ids for valid guild', async () => {
    const { loadCriadores } = require('../../src/utils/file-handler');
    loadCriadores.mockReturnValueOnce({ criadores: ['user-2'] });

    const res = await request(app).get('/api/auth/guilds/guild-1/group-members?group=criadores');
    expect(res.statusCode).toBe(200);
    expect(res.body.ids).toEqual(['user-2']);
  });

  it('should return 400 for invalid group parameter', async () => {
    const res = await request(app).get('/api/auth/guilds/guild-1/group-members?group=moderadores');
    expect(res.statusCode).toBe(400);
  });

  it('should return 403 for inaccessible guild', async () => {
    const res = await request(app).get('/api/auth/guilds/guild-99/group-members?group=mensalistas');
    expect(res.statusCode).toBe(403);
  });
});

describe('Dashboard Auth API - OAuth session persistence', () => {
  const originalEnv = {
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_OAUTH_REDIRECT_URI: process.env.DISCORD_OAUTH_REDIRECT_URI,
  };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.DISCORD_CLIENT_ID = 'client-id';
    process.env.DISCORD_CLIENT_SECRET = 'client-secret';
    process.env.DISCORD_OAUTH_REDIRECT_URI = 'https://example.com/api/auth/discord/callback';
    client.guilds.cache = new Map([
      [
        'guild-1',
        {
          id: 'guild-1',
          name: 'Guild One',
          icon: null,
          members: {
            cache: new Map(),
            fetch: jest.fn(async (userId) => ({
              user: { id: userId, username: 'tester', bot: false },
              displayName: 'Tester',
            })),
          },
        },
      ],
    ]);
  });

  afterEach(() => {
    process.env.DISCORD_CLIENT_ID = originalEnv.DISCORD_CLIENT_ID;
    process.env.DISCORD_CLIENT_SECRET = originalEnv.DISCORD_CLIENT_SECRET;
    process.env.DISCORD_OAUTH_REDIRECT_URI = originalEnv.DISCORD_OAUTH_REDIRECT_URI;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should save session before redirecting to Discord login', async () => {
    const save = jest.fn((callback) => callback());
    const app = express();

    app.use((req, _res, next) => {
      req.session = { save };
      next();
    });
    app.use('/api/auth', authRouter);

    const res = await request(app).get('/api/auth/discord/login');

    expect(res.statusCode).toBe(302);
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.headers.location).toContain('https://discord.com/api/oauth2/authorize');
  });

  it('should save dashboard auth in session before redirecting back to frontend', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'discord-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1', username: 'tester', avatar: null }),
      });

    const save = jest.fn((callback) => callback());
    const app = express();

    app.use((req, _res, next) => {
      req.session = {
        discordOauthState: 'expected-state',
        save,
      };
      next();
    });
    app.use('/api/auth', authRouter);

    const res = await request(app).get('/api/auth/discord/callback?code=oauth-code&state=expected-state');

    expect(res.statusCode).toBe(302);
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.headers.location).toBe('/');
  });
});
