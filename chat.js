const { askLLM } = require('./llm');
const config = require('./config');
const { craftItem } = require('./crafting');
const { isAdmin, sendHelp, normalizeUsername } = require('./admin');
const { setupMovement } = require('./movement');

const cooldown = new Map();

function canRun(user) {
  const now = Date.now();
  const last = cooldown.get(user) || 0;

  if (now - last < config.cooldownMs) return false;

  cooldown.set(user, now);
  return true;
}

function setupChat(bot) {

  const movement = setupMovement(bot);

  bot.on('chat', async (username, message) => {

    if (username === bot.username) return;

    console.log(`[CHAT] ${username}: ${message}`);

    const realUsername = normalizeUsername(username);
    const lower = message.toLowerCase();

    // ================= ADMIN COMMANDS =================

    if (isAdmin(username) && lower.startsWith('!quin')) {

      const args = message.split(' ').slice(1);
      const cmd = (args.shift() || '').toLowerCase();

      console.log(`[CMD] ${realUsername}: ${cmd}`);

      if (cmd === 'help') {
        sendHelp(bot, realUsername, Number(args[0]) || 1);
        return;
      }

      if (cmd === 'say') {
        bot.chat(args.join(' '));
        return;
      }

      if (cmd === 'ping') {
        bot.whisper(realUsername, 'pong');
        return;
      }

      if (cmd === 'inventory') {

        const items = bot.inventory.items();

        bot.whisper(
          realUsername,
          items.length
            ? items.map(i => `${i.count}x ${i.name}`).join(', ')
            : 'empty'
        );

        return;
      }

      if (cmd === 'status') {

        const p = bot.entity.position;

        bot.whisper(
          realUsername,
          `HP:${bot.health} Food:${bot.food} Pos:${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`
        );

        return;
      }

      if (cmd === 'craft') {

        const item = args.join(' ');

        if (!item) {
          bot.whisper(realUsername, 'Usage: !Quin craft <item>');
          return;
        }

        try {
          await craftItem(bot, item);
          bot.whisper(realUsername, `Craft request received: ${item}`);
        } catch (err) {
          console.error(err);
          bot.whisper(realUsername, 'Crafting failed.');
        }

        return;
      }

      if (cmd === 'goto') {

        const target = args[0];

        if (!target) {
          bot.whisper(realUsername, 'Usage: !Quin goto <player>');
          return;
        }

        const ok = movement.gotoPlayer(target);

        bot.whisper(
          realUsername,
          ok ? `going to ${target}` : 'target not found'
        );

        return;
      }

      if (cmd === 'follow') {

        const target = args[0];

        if (!target) {
          bot.whisper(realUsername, 'Usage: !Quin follow <player>');
          return;
        }

        const ok = movement.gotoPlayer(target);

        bot.whisper(
          realUsername,
          ok ? `following ${target}` : 'target not found'
        );

        return;
      }

      if (cmd === 'stopmove') {

        movement.stop();

        bot.whisper(realUsername, 'stopped moving');

        return;
      }

      if (cmd === 'stop') {

        bot.chat('stopping bot');

        process.exit(0);
      }

      bot.whisper(realUsername, `unknown command: ${cmd}`);

      return;
    }
  });

  // ================= AI ONLY IN WHISPERS =================

  bot.on('whisper', async (username, message) => {

    if (username === bot.username) return;
    if (!canRun(username)) return;

    const realUsername = normalizeUsername(username);

    console.log(`[WHISPER] ${realUsername}: ${message}`);

    try {

      const reply = await askLLM(message);

      if (!reply) return;

      bot.whisper(
        realUsername,
        reply.slice(0, 256)
      );

    } catch (err) {
      console.error(err);
    }
  });

  // ================= RAW LOGGING =================

  bot.on('messagestr', msg => {
    console.log('[RAW]', msg.toString());
  });
}

module.exports = {
  setupChat
};
