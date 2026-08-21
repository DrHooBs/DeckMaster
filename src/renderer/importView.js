import { Deck } from '../classes/Deck.js';

export function createImportView({ deckNameInput, deckTextInput, importMessage, deckPreview, deckSummary, deckCards, pasteDeckButton, parseDeckButton, cancelImportButton, importInputs, saveDeckButton, api, navigateTo, renderLoadedDeck, refreshDecks, renderCardRows }) {
  let importedDeck;

  function showMessage(message, type = 'is-info') {
    importMessage.textContent = message;
    importMessage.className = `notification ${type}`;
  }

  function renderPreview(deck) {
    deckSummary.textContent = `${deck.cards.length} card entries, ${deck.cards.reduce((total, card) => total + card.qty, 0)} cards total.`;
    renderCardRows(deckCards, deck, api);
    deckPreview.classList.remove('is-hidden');
  }

  pasteDeckButton?.addEventListener('click', async () => {
    try {
      deckTextInput.value = await navigator.clipboard.readText();
      showMessage('Clipboard contents pasted. Preview the deck to continue.', 'is-success is-light');
    } catch (error) {
      showMessage('Clipboard access was unavailable. Paste the deck list into the text area instead.', 'is-warning is-light');
    }
  });

  parseDeckButton?.addEventListener('click', () => {
    const name = deckNameInput?.value.trim();
    const text = deckTextInput?.value.trim();
    if (!name || !text) {
      showMessage('Enter a deck name and paste a deck list first.', 'is-danger is-light');
      return;
    }
    importedDeck = Deck.fromText(name, text);
    if (importedDeck.cards.length === 0) {
      deckPreview?.classList.add('is-hidden');
      showMessage('No cards were found. Check that the list uses quantity, card name, set, and number.', 'is-danger is-light');
      return;
    }
    renderPreview(importedDeck);
    importInputs?.classList.add('is-hidden');
    showMessage('Deck parsed successfully. Review the preview before saving.', 'is-success is-light');
  });

  cancelImportButton?.addEventListener('click', () => {
    importedDeck = undefined;
    importInputs?.classList.remove('is-hidden');
    deckPreview?.classList.add('is-hidden');
    showMessage('Import cancelled.', 'is-info is-light');
  });

  saveDeckButton?.addEventListener('click', async () => {
    if (!importedDeck) return;
    saveDeckButton.disabled = true;
    try {
      const saved = await api?.saveDeck({ name: importedDeck.name, cards: importedDeck.cards });
      if (!saved) throw new Error('Deck save failed');
      renderLoadedDeck(importedDeck);
      navigateTo('deck-view');
      await refreshDecks();
    } catch (error) {
      showMessage('The deck could not be saved.', 'is-danger is-light');
    } finally {
      saveDeckButton.disabled = false;
    }
  });
}
