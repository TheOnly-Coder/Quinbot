const { askLLM } = require('./llm');
const config = require('./config');
const { craftItem } = require('./crafting');
const { isAdmin, sendHelp, normalizeUsername } = require('./admin');
const { setupMovement } = require('./movement');

const minecraftData = require('minecraft-data');

const cooldown = new Map();

function canRun(user) {
  const now = Date.now();
  const last = cooldown.get(user) || 0;
  if (now - last < config.cooldownMs) return false;
  cooldown.set(user, now);
  return true;
}

// ---------------- FILTER ----------------
function blockedSource(username = '', text = '') {
  const u = (username || '').toLowerCase();
  const t = (text || '').toLowerCase();

  if (u === '@' || u.startsWith('@')) return true;
  if (u.includes('taskmaster')) return true;

  if (t.includes('joined the game') || t.includes('left the game')) return true;
  if (t.includes('{') && t.includes('}')) return true;
  if (t.includes('minecraft:command_block')) return true;
  if (t.includes('bukkit.') || t.includes('paper.') || t.includes('spigot.')) return true;
  if (t.includes('worlduuid') || t.includes('dataversion')) return true;

  return false;
}

function setupChat(bot) {
  const movement = setupMovement(bot);

  const state = {
    automating: false,
    mining: false,
    crafting: false
  };

  // ---------------- STOP SYSTEM ----------------
  function stopMode(mode) {
    mode = (mode || '').toLowerCase();

    if (mode === 'all') {
      state.automating = false;
      state.mining = false;
      state.crafting = false;
      movement.stop('chat:all');
      return;
    }

    if (mode === 'follow' || mode === 'come' || mode === 'goto') {
      movement.stop(`chat:${mode}`);
    }
  }

  // ---------------- MINE ----------------
  async function mineBlock(blockName) {
    try {
      const mcData = minecraftData(bot.version);
      const block = mcData.blocksByName[blockName];

      if (!block) return bot.chat(`Unknown block: ${blockName}`);

      const target = bot.findBlock({
        matching: block.id,
        maxDistance: 64
      });

      if (!target) return bot.chat(`Can't find ${blockName}`);

      await bot.pathfinder.goto(
        new bot.pathfinder.goals.GoalBlock(
          target.position.x,
          target.position.y,
          target.position.z
        )
      );

      if (!state.mining) return;

      await bot.dig(target);
      bot.chat(`Mined ${blockName}`);

    } catch (e) {
      console.log(e);
    }
  }

  async function automateLoop() {
    if (!state.automating) return;

    const goals = ['oak_log', 'stone', 'coal'];

    for (const g of goals) {
      if (!state.automating) return;
      await mineBlock(g);
    }

    setTimeout(automateLoop, 2000);
  }

  // ---------------- COMMANDS ----------------
  async function handleCommand(username, message) {
    const realUsername = normalizeUsername(username);

    if (!isAdmin(username)) return;
    if (!message.startsWith('!Quin')) return;

    const args = message.split(' ').slice(1);
    const cmd = (args.shift() || '').toLowerCase();

    // BASIC
    if (cmd === 'help') return sendHelp(bot, realUsername, Number(args[0]) || 1);
    if (cmd === 'say') return bot.chat(args.join(' '));
    if (cmd === 'ping') return bot.whisper(realUsername, 'pong');

    if (cmd === 'status') {
      const p = bot.entity.position;
      return bot.whisper(
        realUsername,
        `HP:${bot.health} Food:${bot.food} Pos:${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`
      );
    }

    if (cmd === 'inventory') {
      const items = bot.inventory.items();
      return bot.whisper(
        realUsername,
        items.length ? items.map(i => `${i.count}x ${i.name}`).join(', ') : 'empty'
      );
    }

    // ---------------- MOVEMENT (FIXED API) ----------------

    if (cmd === 'follow') {
      const ok = movement.follow(args[0]);
      return bot.whisper(realUsername, ok ? 'following' : 'not found');
    }

    if (cmd === 'come') {
      const ok = movement.follow(realUsername);
      return bot.whisper(realUsername, ok ? 'coming' : 'not found');
    }

    if (cmd === 'goto') {
      const ok = movement.goto(args[0]);
      return bot.whisper(realUsername, ok ? 'going' : 'not found');
    }

    if (cmd === 'lookat') {
      const ok = movement.lookAt(args[0]);
      return bot.whisper(realUsername, ok ? 'ok' : 'not found');
    }

    // ---------------- MINE ----------------
    if (cmd === 'mine') {
      state.mining = true;
      await mineBlock(args[0]);
      return;
    }

    // ---------------- AUTOMATE ----------------
    if (cmd === 'automate') {
      state.automating = !state.automating;
      bot.whisper(
        realUsername,
        state.automating ? 'automation started' : 'automation stopped'
      );
      if (state.automating) automateLoop();
      return;
    }

    // ---------------- CRAFT ----------------
    if (cmd === 'craft') {
      state.crafting = true;
      try {
        await craftItem(bot, args.join(' '));
      } finally {
        state.crafting = false;
      }
      return;
    }

    // ---------------- STOP ----------------
    if (cmd === 'stop') {
      stopMode(args[0]);
      return bot.whisper(realUsername, `stopped ${args[0] || 'all'}`);
    }

    bot.whisper(realUsername, 'unknown command');
  }

  // ---------------- EVENTS ----------------
  bot.on('chat', (u, m) => {
    if (blockedSource(u, m)) return;
    if (m.startsWith('!Quin')) handleCommand(u, m);
  });

  bot.on('whisper', async (u, m) => {
    if (u === bot.username) return;
    if (blockedSource(u, m)) return;

    if (m.startsWith('!Quin')) {
      handleCommand(u, m);
      return;
    }

    if (!canRun(u)) return;

    const reply = await askLLM(m).catch(() => '');
    if (reply) bot.whisper(normalizeUsername(u), reply.slice(0, 256));
  });
}

module.exports = { setupChat };
