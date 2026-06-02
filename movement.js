const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

function setupMovement(bot) {
  bot.loadPlugin(pathfinder);

  let mcData;
  let defaultMove;

  bot.once('spawn', () => {
    mcData = require('minecraft-data')(bot.version);
    defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);
  });

  async function gotoPlayer(name) {
    const target = bot.players[name]?.entity;

    if (!target) return false;

    const { GoalNear } = goals;

    bot.pathfinder.setGoal(
      new GoalNear(target.position.x, target.position.y, target.position.z, 1)
    );

    return true;
  }

  async function stop() {
    bot.pathfinder.setGoal(null);
  }

  return {
    gotoPlayer,
    stop
  };
}

module.exports = { setupMovement };
