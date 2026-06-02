const readline = require('readline');

function setupCommands(bot) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('CLI ready: say <msg> | stop');

  rl.on('line', (input) => {
    const msg = input.trim();

    if (msg === 'stop') {
      console.log('Stopping bot...');
      bot.end();
      process.exit(0);
    }

    if (msg.startsWith('say ')) {
      const text = msg.slice(4);

      bot.chat(text.slice(0, 256));

      console.log('[SENT]', text);
      return;
    }

    console.log('Commands: say <msg> | stop');
  });
}

module.exports = {
  setupCommands
};
