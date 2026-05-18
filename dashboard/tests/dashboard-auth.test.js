const request = require('supertest');
const express = require('express');

jest.mock('../../src/core/client', () => ({
  client: {
    guilds: { cache: new Map() },
  },
}));

jest.mock('../../src/utils/file-handler', () => ({
  loadMensalistas: jest.fn(() => ({ mensalistas: [] })),
  loadCriadores: jest.fn(() => ({ criadores: [] })),
}));

const { client } = require('../../src/core/client');
const { loadCriadores } = require('../../src/utils/file-handler');
const { authRouter, clearGuildEmojiCache } = require('../api/auth');

afterEach(() => {
  clearGuildEmojiCache();
});

beforeEach(() => {
  loadCriadores.mockReturnValue({
    criadores: [
      {
        id: 'user-1',
        addedAt: '2026-04-09T00:00:00.000Z',
        addedBy: 'admin-1',
      },
    ],
  });
});

describe('Dashboard Auth API - guild selectors', () => {
  let app;
  let guildOneEmojiFetch;

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

    guildOneEmojiFetch = jest.fn(
      async () =>
        new Map([
          [
            'emoji-2',
            {
              id: 'emoji-2',
              name: 'foguete',
              animated: false,
            },
          ],
        ]),
    );

    client.guilds.cache = new Map([
      [
        'guild-1',
        {
          id: 'guild-1',
          name: 'Guild One',
          icon: null,
          emojis: {
            cache: new Map([
              [
                'emoji-1',
                {
                  id: 'emoji-1',
                  name: 'livro',
                  animated: false,
                },
              ],
            ]),
            fetch: guildOneEmojiFetch,
          },
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
          emojis: {
            cache: new Map(),
            fetch: jest.fn(async () => null),
          },
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
        emojis: [
          {
            id: 'emoji-1',
            name: 'livro',
            animated: false,
            identifier: '<:livro:emoji-1>',
            url: 'https://cdn.discordapp.com/emojis/emoji-1.webp?size=64&quality=lossless',
          },
        ],
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

  it('should return cached emojis for selected guild by default', async () => {
    const res = await request(app).get('/api/auth/guilds/guild-1/emojis');

    expect(res.statusCode).toBe(200);
    expect(guildOneEmojiFetch).not.toHaveBeenCalled();
    expect(res.body.emojis).toEqual([
      {
        id: 'emoji-1',
        name: 'livro',
        animated: false,
        identifier: '<:livro:emoji-1>',
        url: 'https://cdn.discordapp.com/emojis/emoji-1.webp?size=64&quality=lossless',
      },
    ]);
  });

  it('should reuse cached emojis until refresh is requested', async () => {
    const firstResponse = await request(app).get('/api/auth/guilds/guild-1/emojis');
    const secondResponse = await request(app).get('/api/auth/guilds/guild-1/emojis');

    expect(firstResponse.statusCode).toBe(200);
    expect(secondResponse.statusCode).toBe(200);
    expect(guildOneEmojiFetch).toHaveBeenCalledTimes(0);

    const refreshedResponse = await request(app).get('/api/auth/guilds/guild-1/emojis?refresh=true');
    expect(refreshedResponse.statusCode).toBe(200);
    expect(guildOneEmojiFetch).toHaveBeenCalledTimes(1);
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
    loadMensalistas.mockReturnValueOnce({
      mensalistas: [
        {
          id: 'user-1',
          addedAt: '2026-04-08T12:30:00.000Z',
          addedBy: 'user-2',
        },
        'user-2',
      ],
    });

    const res = await request(app).get('/api/auth/guilds/guild-1/group-members?group=mensalistas');
    expect(res.statusCode).toBe(200);
    expect(res.body.ids).toEqual(['user-1', 'user-2']);
    expect(res.body.members).toEqual([
      {
        id: 'user-1',
        addedAt: '2026-04-08T12:30:00.000Z',
        addedBy: 'user-2',
      },
      {
        id: 'user-2',
        addedAt: null,
        addedBy: null,
      },
    ]);
  });

  it('should return criador ids for valid guild', async () => {
    const { loadCriadores } = require('../../src/utils/file-handler');
    loadCriadores.mockReturnValueOnce({
      criadores: [
        {
          id: 'user-1',
          addedAt: '2026-04-09T00:00:00.000Z',
          addedBy: 'user-1',
        },
      ],
    });
    loadCriadores.mockReturnValueOnce({
      criadores: [
        {
          id: 'user-2',
          adicionadoEm: '2026-04-01T09:00:00.000Z',
          adicionadoPor: 'user-1',
        },
      ],
    });

    const res = await request(app).get('/api/auth/guilds/guild-1/group-members?group=criadores');
    expect(res.statusCode).toBe(200);
    expect(res.body.ids).toEqual(['user-2']);
    expect(res.body.members).toEqual([
      {
        id: 'user-2',
        addedAt: '2026-04-01T09:00:00.000Z',
        addedBy: 'user-1',
      },
    ]);
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

describe('Dashboard Auth API - /me and /logout', () => {
  it('GET /api/auth/me returns authenticated true for valid session', async () => {
    const app = express();
    const touch = jest.fn();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.session = {
        dashboardAuth: {
          userId: 'user-1',
          username: 'tester',
          avatar: 'https://example.com/avatar.png',
          guildId: 'guild-1',
        },
        touch,
      };
      next();
    });
    app.use('/api/auth', authRouter);

    client.guilds.cache = new Map([
      [
        'guild-1',
        {
          id: 'guild-1',
          name: 'Guild One',
          members: {
            cache: new Map([
              [
                'user-1',
                {
                  user: { id: 'user-1', username: 'tester', bot: false },
                  displayName: 'Tester',
                },
              ],
            ]),
            fetch: jest.fn(async () => new Map()),
          },
          channels: { cache: new Map(), fetch: jest.fn(async () => new Map()) },
        },
      ],
    ]);

    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        username: 'tester',
        avatar: 'https://example.com/avatar.png',
        guildId: 'guild-1',
      }),
    );
    expect(touch).toHaveBeenCalledTimes(1);
  });

  it('GET /api/auth/me returns authenticated false when no session', async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.session = {}; // sem dashboardAuth
      next();
    });
    app.use('/api/auth', authRouter);

    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.authenticated).toBe(false);
    expect(res.body.error).toBeTruthy();
    expect(res.body.reason).toBe('missing_session');
  });

  it('GET /api/auth/me returns expired reason when cookie exists but session missing', async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.headers.cookie = 'dashboard.sid=expired-session';
      req.session = {}; // sem dashboardAuth
      next();
    });
    app.use('/api/auth', authRouter);

    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.authenticated).toBe(false);
    expect(res.body.reason).toBe('expired');
  });

  it('POST /api/auth/logout clears session and returns success', async () => {
    const app = express();
    app.use(express.json());
    const destroy = jest.fn((cb) => cb());
    app.use((req, _res, next) => {
      req.session = { destroy };
      next();
    });
    app.use('/api/auth', authRouter);

    const res = await request(app).post('/api/auth/logout');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('dashboard.sid=')]));
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
    loadCriadores.mockReturnValueOnce({
      criadores: [
        {
          id: 'user-1',
          addedAt: '2026-04-09T00:00:00.000Z',
          addedBy: 'admin-1',
        },
      ],
    });

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
