const fs = require('fs');

const recipes =
  JSON.parse(
    fs.readFileSync('./recipes.json', 'utf8')
  );

function getRecipe(item) {
  return recipes[item.toLowerCase()];
}

async function craftItem(bot, itemName) {
  const recipe = getRecipe(itemName);

  if (!recipe) {
    bot.chat(`I don't know how to make ${itemName}.`);
    return;
  }

  bot.chat(`I know how to make ${itemName}.`);

  // actual crafting logic later
}

module.exports = {
  craftItem
};
