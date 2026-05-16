const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');
const config = require('../utils/config');
const logger = require('../utils/logger');

function createExpressApp() {
  const app = express();
  const port = config.PORT;
  const dashboardFrontendDist = path.join(__dirname, '../../public');
  const isProductionEnv = config.APP_ENV === 'prod';
  const redisUrl = process.env.REDIS_URL;

  let sessionStore;
  if (redisUrl) {
    const redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => logger.error('Redis client error:', err));
    redisClient.connect().catch((err) => logger.error('Redis connection failed:', err));
    sessionStore = new RedisStore({ client: redisClient, ttl: 12 * 60 * 60 });
    logger.info('Sessão do dashboard utilizando RedisStore.');
  } else if (isProductionEnv) {
    logger.error('Produção requer REDIS_URL configurado para persistência de sessão.');
    logger.error('Defina REDIS_URL=redis://redis:6379 no arquivo .env');
    process.exit(1);
  } else {
    logger.warn('REDIS_URL não configurado. Usando MemoryStore (apenas para desenvolvimento).');
  }

  if (isProductionEnv) {
    app.set('trust proxy', 1);
  }

  app.use(express.json());
  app.use(
    session({
      name: 'dashboard.sid',
      secret: process.env.DASHBOARD_SESSION_SECRET || 'dashboard-dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProductionEnv ? 'auto' : false,
        maxAge: 12 * 60 * 60 * 1000,
      },
    }),
  );

  app.get('/api/health', (req, res) => res.send(`Bot Online! [${config.APP_ENV.toUpperCase()}]`));

  const { authRouter: dashboardAuthRouter } = require('../../dashboard/api/auth');
  app.use('/api/auth', dashboardAuthRouter);

  const dashboardCommandsRouter = require('../../dashboard/api/dashboard-commands');
  app.use('/api/commands', dashboardCommandsRouter);

  const dashboardPollsRouter = require('../../dashboard/api/dashboard-polls');
  app.use('/api/polls', dashboardPollsRouter);

  const dashboardCsvRouter = require('../../dashboard/api/dashboard-csv');
  app.use('/api/csv', dashboardCsvRouter);

  app.use('/api', (req, res) => {
    return res.status(404).json({ error: 'Endpoint de API não encontrado' });
  });

  if (fs.existsSync(dashboardFrontendDist)) {
    app.use(express.static(dashboardFrontendDist));

    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }

      return res.sendFile(path.join(dashboardFrontendDist, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => res.send(`Bot Online! [${config.APP_ENV.toUpperCase()}]`));
  }

  let keepAliveStarted = false;
  function startKeepAlive() {
    if (keepAliveStarted) return;
    keepAliveStarted = true;
    app.listen(port, () => {
      // O log será feito após o bot estar online
    });
  }

  return { app, port, startKeepAlive };
}

module.exports = {
  createExpressApp,
};
