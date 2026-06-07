const fs = require('fs');

const recipes = JSON.parse(fs.readFileSync('./recipes.json', 'utf8'));

function getRecipe(item) {
  return recipes[item.toLowerCase()];
}

async function craftItem(bot, itemName) {
  const recipe = getRecipe(itemName);

  if (!recipe) {
    bot.chat(`I don't know how to make ${itemName}`);
    return;
  }

  const mcData = require('minecraft-data')(bot.version);
  const item = mcData.itemsByName[itemName];

  if (!item) {
    bot.chat(`Unknown item ${itemName}`);
    return;
  }

  const craftingTable = bot.findBlock({
    matching: mcData.blocksByName.crafting_table.id,
    maxDistance: 6
  });

  if (!craftingTable) {
    bot.chat('No crafting table nearby');
    return;
  }

  await bot.pathfinder.goto(
    new bot.pathfinder.goals.GoalBlock(
      craftingTable.position.x,
      craftingTable.position.y,
      craftingTable.position.z
    )
  );

  try {
    const recipeData = bot.recipesFor(item.id, null, 1)[0];
    if (!recipeData) {
      bot.chat('No recipe available');
      return;
    }

    await bot.craft(recipeData, 1, craftingTable);
    bot.chat(`Crafted ${itemName}`);
  } catch (e) {
    bot.chat('Craft failed');
  }
}

module.exports = { craftItem };
