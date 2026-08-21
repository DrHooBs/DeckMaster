const fs = require('node:fs/promises');
const path = require('node:path');

function fileForName(decksDir, name) {
  const safeName = String(name || '').replace(/[^a-z0-9 _-]/gi, '').trim();
  return safeName ? path.join(decksDir, `${safeName}.json`) : null;
}

function createDeckStore(decksDir) {
  return {
    async save(deckData) {
      try {
        const name = String(deckData?.name || '').trim();
        const cards = Array.isArray(deckData?.cards) ? deckData.cards : [];
        const deckFile = fileForName(decksDir, name);
        if (!deckFile || cards.length === 0) return false;
        await fs.writeFile(deckFile, JSON.stringify({ name, cards, coverCard: deckData.coverCard || null }, null, 2), 'utf-8');
        return true;
      } catch (error) {
        console.error('Error saving deck:', error);
        return false;
      }
    },

    async list() {
      try {
        const files = await fs.readdir(decksDir);
        const decks = [];
        for (const file of files.filter((entry) => entry.endsWith('.json'))) {
          try {
            const deck = JSON.parse(await fs.readFile(path.join(decksDir, file), 'utf-8'));
            if (deck?.name && Array.isArray(deck.cards)) decks.push(deck);
          } catch (error) {
            console.error(`Error reading deck file ${file}:`, error);
          }
        }
        return decks;
      } catch (error) {
        console.error('Error listing decks:', error);
        return [];
      }
    },

    async delete(name) {
      try {
        const deckFile = fileForName(decksDir, name);
        if (!deckFile) return false;
        await fs.unlink(deckFile);
        return true;
      } catch (error) {
        console.error('Error deleting deck:', error);
        return false;
      }
    },
  };
}

module.exports = { createDeckStore, fileForName };
