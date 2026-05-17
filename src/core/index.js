const envFile = process.env.APP_ENV === 'staging' ? '.env.staging' : '.env';
require('dotenv').config({ path: envFile });

const { client } = require('./client');
const config = require('../utils/config');

config.logConfig();

const pollPersistence = require('./poll-persistence');
pollPersistence.attachToClient(client);
pollPersistence.init();

const commandLoader = require('./command-loader');
commandLoader.loadIntoClient(client);

const { startKeepAlive, port } = require('./express-app').createExpressApp();

const reactionHandler = require('./reaction-handler');
reactionHandler.registerReactionHandlers(client);

commandLoader.registerInteractionHandlers(client);

const bootstrap = require('./bootstrap');
bootstrap.registerBootstrapHandlers({ client, startKeepAlive, port });

client.login(config.TOKEN);
