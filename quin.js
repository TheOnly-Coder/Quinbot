const mineflayer = require('mineflayer');

const config = require('./config');
const { setupChat } = require('./chat');
const { setupCommands } = require('./commands');

const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  version: false
});

bot.once('spawn', () => {
  console.log('Quin online.');
});

bot.on('error', console.error);

bot.on('end', () => {
  console.log('Disconnected.');
});

setupChat(bot);
setupCommands(bot);
