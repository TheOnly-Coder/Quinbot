const minecraftData = require('minecraft-data');
const { Movements, goals } = require('mineflayer-pathfinder');

function trace(reason, extra = {}) {
  console.log(`[MOVE TRACE] ${reason}`, extra);
}

function cleanName(name) {
  return (name || '')
    .replace(/§./g, '')
    .trim()
    .split(/\s+/)
    .pop();
}

class Movement {
  constructor(bot) {
    this.bot = bot;

    const mcData = minecraftData(bot.version);
    this.mcData = mcData;

    this.movements = new Movements(bot, mcData);

    this.movements.allow1by1towers = true;
    this.movements.allowParkour = true;
    this.movements.allowSprinting = true;
    this.movements.allowFreeMotion = true;
    this.movements.canDig = true;

    bot.pathfinder.setMovements(this.movements);

    // STATE CONTROL
    this.mode = 'idle';
    this.target = null;

    // 🔥 prevents ANY stale movement resurrection
    this.token = 0;

    trace('Movement system initialized');
  }

  // =========================================================
  // INTERNAL SAFE APPLY (guards stale calls)
  // =========================================================
  _apply(goalFn, token) {
    if (token !== this.token) {
      trace('IGNORED STALE MOVEMENT');
      return false;
    }

    try {
      goalFn();
      return true;
    } catch (e) {
      trace('MOVEMENT ERROR', { error: e.message });
      return false;
    }
  }

  // =========================================================
  // FOLLOW PLAYER
  // =========================================================
  follow(username) {
    const token = ++this.token;

    const clean = cleanName(username);
    const target = this.bot.players?.[clean]?.entity;

    trace('FOLLOW REQUEST', { clean, token });

    if (!target) {
      trace('FOLLOW FAILED (no entity)', { clean });
      return false;
    }

    this.mode = 'follow';
    this.target = clean;

    const runFollow = () => this._apply(() => {
      this.bot.pathfinder.setGoal(
        new goals.GoalFollow(target, 2),
        true
      );
    }, token);

    runFollow();

    // watchdog keeps follow alive BUT respects stop token
    const loop = setInterval(() => {
      if (this.token !== token) {
        clearInterval(loop);
        return;
      }

      const stillExists = this.bot.players?.[clean]?.entity;
      if (!stillExists) {
        trace('FOLLOW LOST TARGET');
        this.stop('lost target');
        clearInterval(loop);
        return;
      }

      runFollow();
    }, 800);

    return true;
  }

  // =========================================================
  // GOTO PLAYER (non-follow)
  // =========================================================
  goto(username) {
    const token = ++this.token;

    const clean = cleanName(username);
    const target = this.bot.players?.[clean]?.entity;

    trace('GOTO REQUEST', { clean, token });

    if (!target) return false;

    this.mode = 'goto';
    this.target = clean;

    return this._apply(() => {
      this.bot.pathfinder.setGoal(
        new goals.GoalNear(
          target.position.x,
          target.position.y,
          target.position.z,
          1
        )
      );
    }, token);
  }

  // =========================================================
  // LOOK AT PLAYER
  // =========================================================
  lookAt(username) {
    const clean = cleanName(username);
    const target = this.bot.players?.[clean]?.entity;

    trace('LOOKAT REQUEST', { clean });

    if (!target) return false;

    this.bot.lookAt(target.position.offset(0, 1.6, 0));
    return true;
  }

  // =========================================================
  // HARD STOP (ONLY TRUE KILL SWITCH)
  // =========================================================
  stop(reason = 'manual') {
    const token = ++this.token;

    trace('STOP CALLED', {
      reason,
      mode: this.mode,
      target: this.target,
      token
    });

    this.mode = 'stopped';
    this.target = null;

    try {
      this.bot.pathfinder.setGoal(null);
      this.bot.pathfinder.stop();
    } catch (e) {
      trace('STOP ERROR', { error: e.message });
    }

    return true;
  }

  // =========================================================
  // DEBUG
  // =========================================================
  debugState() {
    return {
      mode: this.mode,
      target: this.target,
      token: this.token
    };
  }
}

function setupMovement(bot) {
  return new Movement(bot);
}

module.exports = { setupMovement };
