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
