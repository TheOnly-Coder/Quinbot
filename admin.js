const config = require('./config');

function normalizeUsername(username) {
  if (!username) return '';

  const clean = username
    .replace(/§./g, '')
    .trim();

  const parts = clean.split(/\s+/);

  return parts[parts.length - 1];
}

function isAdmin(username) {
  const name = normalizeUsername(username);

  return config.admins.includes(name);
}

const helpPages = {
  1: [
    '!Quin help',
    '!Quin say <msg>',
    '!Quin stop',
    '!Quin follow <player>',
    '!Quin unfollow',
    '!Quin inventory',
    '!Quin craft <item>',
    '!Quin ping'
  ],

  2: [
    '!Quin dropall',
    '!Quin come',
    '!Quin goto <player>',
    '!Quin equip <item>',
    '!Quin unequip',
    '!Quin lookat <player>',
    '!Quin status',
    '!Quin reload'
  ]
};

function sendHelp(bot, username, page = 1) {
  const cmds = helpPages[page];

  if (!cmds) {
    bot.whisper(username, 'That help page does not exist.');
    return;
  }

  bot.whisper(
    username,
    `Help Page ${page}: ${cmds.join(' | ')}`
  );
}

module.exports = {
  isAdmin,
  sendHelp,
  normalizeUsername
};
