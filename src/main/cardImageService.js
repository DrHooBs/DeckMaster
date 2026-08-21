const { getCardImageUrl } = require('../utils/getCardImage');

function createCardImageService() {
  return {
    get(card) {
      if (!card?.set || card.number === undefined) return Promise.resolve(null);
      if (card.imageUrl) return Promise.resolve(card.imageUrl);
      return getCardImageUrl(card.set, card.number);
    },
  };
}

module.exports = { createCardImageService };
