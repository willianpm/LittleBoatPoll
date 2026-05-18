const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');
const config = require('../utils/config');
const logger = require('../utils/logger');

const DEFAULT_DASHBOARD_SESSION_DAYS = 30;

function resolveDashboardSessionDays() {
  const rawValue = process.env.DASHBOARD_SESSION_MAX_AGE_DAYS;
  if (!rawValue) {
    return DEFAULT_DASHBOARD_SESSION_DAYS;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger.warn(
      `DASHBOARD_SESSION_MAX_AGE_DAYS inválido: "${rawValue}". Usando ${DEFAULT_DASHBOARD_SESSION_DAYS} dias.`,
    );
    return DEFAULT_DASHBOARD_SESSION_DAYS;
  }

  return parsed;
}

function createExpressApp() {
  const app = express();
  const port = config.PORT;
  const dashboardFrontendDist = path.join(__dirname, '../../public');
  const isProductionEnv = config.APP_ENV === 'prod';
  const redisUrl = process.env.REDIS_URL;
  const sessionSecret = process.env.DASHBOARD_SESSION_SECRET;
  const sessionMaxAgeDays = resolveDashboardSessionDays();
  const sessionMaxAgeMs = Math.round(sessionMaxAgeDays * 24 * 60 * 60 * 1000);
  const sessionTtlSeconds = Math.ceil(sessionMaxAgeMs / 1000);

  let sessionStore;
  if (redisUrl) {
    const redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => logger.error('Redis client error:', err));
    redisClient.connect().catch((err) => logger.error('Redis connection failed:', err));
    sessionStore = new RedisStore({ client: redisClient, ttl: sessionTtlSeconds, disableTouch: false });
    logger.info('Sessão do dashboard utilizando RedisStore.');
  } else if (isProductionEnv) {
    logger.error('Produção requer REDIS_URL configurado para persistência de sessão.');
    logger.error('Defina REDIS_URL=redis://redis:6379 no arquivo .env');
    process.exit(1);
  } else {
    logger.warn('REDIS_URL não configurado. Usando MemoryStore (apenas para desenvolvimento).');
  }

  if (isProductionEnv && (!sessionSecret || sessionSecret === 'dashboard-dev-secret-change-me')) {
    logger.error('Produção requer DASHBOARD_SESSION_SECRET configurado e diferente do valor padrão.');
    process.exit(1);
  }

  if (isProductionEnv) {
    app.set('trust proxy', 1);
  }

  app.use(express.json());
  app.use(
    session({
      name: 'dashboard.sid',
      secret: sessionSecret || 'dashboard-dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProductionEnv ? 'auto' : false,
        maxAge: sessionMaxAgeMs,
      },
    }),
  );

  logger.info(`Sessão do dashboard: ${sessionMaxAgeDays} dias (rolling).`);

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
