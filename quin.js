const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');

const config = require('./config');
const { setupChat } = require('./chat');
const { setupCommands } = require('./commands');

function startBot() {

  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: false
  });

  bot.loadPlugin(pathfinder);

  // ================= LIFECYCLE LOGS (IMPORTANT) =================

  bot.once('spawn', () => {
    console.log('[BOT] Quin online.');
    setupChat(bot);
    setupCommands(bot);
  });

  bot.on('login', () => {
    console.log('[BOT] Logged into server.');
  });

  bot.on('spawn', () => {
    console.log('[BOT] Spawned into world.');
  });

  bot.on('error', (err) => {
    console.log('[BOT ERROR]', err);
  });

  bot.on('kicked', (reason) => {
    console.log('[BOT KICKED]', reason);
  });

  bot.on('end', () => {
    console.log('[BOT] Disconnected.');
    setTimeout(startBot, 5000);
  });

  return bot;
}

startBot();
