export function createDeckListView({ savedDecks, noDecks, api, navigateTo, renderLoadedDeck, openDeleteModal }) {
  function render(decks) {
    if (!savedDecks || !noDecks) return;
    noDecks.classList.toggle('is-hidden', decks.length > 0);
    savedDecks.replaceChildren(...decks.map((deck) => {
      const card = document.createElement('article');
      card.className = 'card deck-card';

      const imagePlaceholder = document.createElement('div');
      imagePlaceholder.className = 'deck-card-image';
      imagePlaceholder.textContent = 'Deck image';
      if (deck.coverCard) {
        api?.getCardImage(deck.coverCard).then((imageUrl) => {
          if (!imageUrl) return;
          const image = document.createElement('img');
          image.src = imageUrl;
          image.alt = `${deck.name} cover card`;
          imagePlaceholder.replaceChildren(image);
        });
      }

      const content = document.createElement('div');
      content.className = 'card-content';
      const title = document.createElement('p');
      title.className = 'title is-5';
      title.textContent = deck.name;
      const summary = document.createElement('p');
      summary.className = 'content';
      summary.textContent = `${deck.cards.length} card entries`;
      const openButton = document.createElement('button');
      openButton.className = 'button is-link is-light';
      openButton.type = 'button';
      openButton.textContent = 'Open deck';
      openButton.addEventListener('click', () => {
        renderLoadedDeck(deck);
        navigateTo('deck-view');
      });

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete deck-delete-button';
      deleteButton.type = 'button';
      deleteButton.setAttribute('aria-label', `Delete ${deck.name}`);
      deleteButton.title = 'Delete deck';
      deleteButton.addEventListener('click', () => openDeleteModal(deck));

      content.append(title, summary, openButton);
      card.append(imagePlaceholder, deleteButton, content);
      return card;
    }));
  }

  async function load() {
    render(await api?.getDecks() || []);
  }

  return { render, load };
}
