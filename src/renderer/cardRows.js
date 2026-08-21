export function cardsMatch(firstCard, secondCard) {
  return firstCard?.set === secondCard?.set && String(firstCard?.number) === String(secondCard?.number);
}

export async function renderCardRows(container, deck, api, { allowCover = false, onCoverSelected } = {}) {
  if (!container) return;
  const rows = deck.cards.map((card) => {
    const row = document.createElement('tr');
    const imageCell = document.createElement('td');
    const image = document.createElement('img');
    image.className = 'card-image';
    image.alt = `${card.cardName} card image`;
    image.addEventListener('error', () => {
      image.removeAttribute('src');
      image.alt = 'Card image unavailable';
    });
    imageCell.appendChild(image);
    row.appendChild(imageCell);

    [card.qty, card.cardName, card.set, card.number, card.cardType || 'Uncategorized'].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    if (allowCover) {
      const coverCell = document.createElement('td');
      const coverButton = document.createElement('button');
      coverButton.className = 'button is-small is-light';
      coverButton.type = 'button';
      coverButton.textContent = cardsMatch(deck.coverCard, card) ? '★' : '☆';
      coverButton.title = 'Set as deck cover';
      coverButton.setAttribute('aria-label', `Set ${card.cardName} as deck cover`);
      coverButton.addEventListener('click', async () => {
        deck.coverCard = { set: card.set, number: card.number, cardName: card.cardName, imageUrl: card.imageUrl };
        if (onCoverSelected) await onCoverSelected(deck);
      });
      coverCell.appendChild(coverButton);
      row.appendChild(coverCell);
    }
    return row;
  });

  container.replaceChildren(...rows);
  await Promise.all(deck.cards.map(async (card, index) => {
    const imageUrl = card.imageUrl || await api?.getCardImage(card);
    if (imageUrl) {
      card.imageUrl = imageUrl;
      rows[index].querySelector('img').src = imageUrl;
    }
  }));
}
