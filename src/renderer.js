import { UserPreferences } from './classes/UserPreferences.js';
import { Deck } from './classes/Deck.js';

window.addEventListener('DOMContentLoaded', async () => {
  const burgerButton = document.querySelector('#burger-button');
  const navbarMenu = document.querySelector('#navbar-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');
  const newDeckButton = document.querySelector('#new-deck');
  const settingsSaveButton = document.querySelector('#save-btn');
  const trainerNameEl = document.getElementById('trainer-name');
  const deckNameInput = document.getElementById('deck-name');
  const deckTextInput = document.getElementById('deck-text');
  const importMessage = document.getElementById('import-message');
  const deckPreview = document.getElementById('deck-preview');
  const deckSummary = document.getElementById('deck-summary');
  const deckCards = document.getElementById('deck-cards');
  const pasteDeckButton = document.getElementById('paste-deck');
  const parseDeckButton = document.getElementById('parse-deck');
  const saveDeckButton = document.getElementById('save-deck');
  const cancelImportButton = document.getElementById('cancel-import');
  const importInputs = document.getElementById('import-inputs');
  const savedDecks = document.getElementById('saved-decks');
  const noDecks = document.getElementById('no-decks');
  const loadedDeckName = document.getElementById('loaded-deck-name');
  const loadedDeckSummary = document.getElementById('loaded-deck-summary');
  const loadedDeckCards = document.getElementById('loaded-deck-cards');
  const backToDecksButton = document.getElementById('back-to-decks');
  const exportDeckPdfButton = document.getElementById('export-deck-pdf');
  const deleteModal = document.getElementById('delete-modal');
  const deleteDeckName = document.getElementById('delete-deck-name');
  const deleteNameInput = document.getElementById('delete-name-input');
  const deleteError = document.getElementById('delete-error');
  const confirmDeleteButton = document.getElementById('confirm-delete');
  const closeDeleteModalButton = document.getElementById('close-delete-modal');
  const cancelDeleteButton = document.getElementById('cancel-delete');

  let importedDeck;
  let deckToDelete;
  let loadedDeck;

  const saveToast = document.getElementById('save-toast');
  const toastDismiss = document.getElementById('toast-dismiss');

  toastDismiss?.addEventListener('click', () => {
    saveToast.classList.add('is-hidden');
  });
  // Input references
  const displayNameInput = document.getElementById('display-name');
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const dateOfBirthInput = document.getElementById('date-of-birth');
  const playerIdInput = document.getElementById('player-id');

  let currentPreferences = new UserPreferences();

  // 1. Navigation / Router
  function navigateTo(pageId) {
    const targetSection = document.getElementById(pageId);
    if (!targetSection) {
      console.warn(`View target "${pageId}" does not exist.`);
      return;
    }
    viewSections.forEach((section) => section.classList.add('is-hidden'));
    targetSection.classList.remove('is-hidden');

    if (pageId === 'decks') loadSavedDecks();

    burgerButton?.classList.remove('is-active');
    navbarMenu?.classList.remove('is-active');
  }

  // 2. Hamburger Dropdown
  if (burgerButton && navbarMenu) {
    burgerButton.addEventListener('click', () => {
      burgerButton.classList.toggle('is-active');
      navbarMenu.classList.toggle('is-active');
    });
  }

  // 3. Navigation Links Binding
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigateTo(link.dataset.target);
    });
  });

  // TODO: A deck creation form should take this test buttons place
  // 4. Native Context Menu Trigger
  if (newDeckButton) {
    newDeckButton.addEventListener('click', () => {
      window.api?.deckShowContextMenu();
    });
  }

  function showImportMessage(message, type = 'is-info') {
    if (!importMessage) return;
    importMessage.textContent = message;
    importMessage.className = `notification ${type}`;
  }

  function cardsMatch(firstCard, secondCard) {
    return firstCard?.set === secondCard?.set && String(firstCard?.number) === String(secondCard?.number);
  }

  async function renderCardRows(container, deck, allowCover = false) {
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
          const saved = await window.api?.saveDeck(deck);
          if (saved) {
            renderLoadedDeck(deck);
            await loadSavedDecks();
          }
        });
        coverCell.appendChild(coverButton);
        row.appendChild(coverCell);
      }
      return row;
    });
    container.replaceChildren(...rows);
    await Promise.all(deck.cards.map(async (card, index) => {
      const imageUrl = card.imageUrl || await window.api?.getCardImage(card);
      if (imageUrl) {
        card.imageUrl = imageUrl;
        rows[index].querySelector('img').src = imageUrl;
      }
    }));
  }

  function renderDeckPreview(deck) {
    if (!deckPreview || !deckSummary || !deckCards) return;
    deckSummary.textContent = `${deck.cards.length} card entries, ${deck.cards.reduce((total, card) => total + card.qty, 0)} cards total.`;
    renderCardRows(deckCards, deck);
    deckPreview.classList.remove('is-hidden');
  }

  function renderLoadedDeck(deck) {
    if (!loadedDeckName || !loadedDeckSummary || !loadedDeckCards) return;
    loadedDeck = deck;
    loadedDeckName.textContent = deck.name;
    loadedDeckSummary.textContent = `${deck.cards.length} card entries, ${deck.cards.reduce((total, card) => total + card.qty, 0)} cards total.`;
    renderCardRows(loadedDeckCards, deck, true);
  }

  function renderSavedDecks(decks) {
    if (!savedDecks || !noDecks) return;
    noDecks.classList.toggle('is-hidden', decks.length > 0);
    savedDecks.replaceChildren(...decks.map((deck) => {
      const card = document.createElement('article');
      card.className = 'card deck-card';

      const imagePlaceholder = document.createElement('div');
      imagePlaceholder.className = 'deck-card-image';
      imagePlaceholder.textContent = 'Deck image';
      if (deck.coverCard) {
        window.api?.getCardImage(deck.coverCard).then((imageUrl) => {
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
      deleteButton.addEventListener('click', () => {
        deckToDelete = deck;
        deleteDeckName.textContent = deck.name;
        deleteNameInput.value = '';
        deleteError.classList.add('is-hidden');
        confirmDeleteButton.disabled = true;
        deleteModal.classList.add('is-active');
        deleteNameInput.focus();
      });

      content.append(title, summary, openButton);
      card.append(imagePlaceholder, deleteButton, content);
      return card;
    }));
  }

  async function loadSavedDecks() {
    const decks = await window.api?.getDecks() || [];
    renderSavedDecks(decks);
  }

  function closeDeleteModal() {
    deleteModal?.classList.remove('is-active');
    deckToDelete = undefined;
  }

  deleteNameInput?.addEventListener('input', () => {
    const matches = deckToDelete && deleteNameInput.value === deckToDelete.name;
    confirmDeleteButton.disabled = !matches;
    deleteError.classList.toggle('is-hidden', !deleteNameInput.value || matches);
  });

  closeDeleteModalButton?.addEventListener('click', closeDeleteModal);
  cancelDeleteButton?.addEventListener('click', closeDeleteModal);
  deleteModal?.querySelector('.modal-background')?.addEventListener('click', closeDeleteModal);

  confirmDeleteButton?.addEventListener('click', async () => {
    if (!deckToDelete || deleteNameInput.value !== deckToDelete.name) return;
    confirmDeleteButton.disabled = true;
    const deleted = await window.api?.deleteDeck(deckToDelete.name);
    if (deleted) {
      closeDeleteModal();
      await loadSavedDecks();
    } else {
      confirmDeleteButton.disabled = false;
      deleteError.textContent = 'The deck could not be deleted.';
      deleteError.classList.remove('is-hidden');
    }
  });

  pasteDeckButton?.addEventListener('click', async () => {
    try {
      deckTextInput.value = await navigator.clipboard.readText();
      showImportMessage('Clipboard contents pasted. Preview the deck to continue.', 'is-success is-light');
    } catch (error) {
      showImportMessage('Clipboard access was unavailable. Paste the deck list into the text area instead.', 'is-warning is-light');
    }
  });

  parseDeckButton?.addEventListener('click', () => {
    const name = deckNameInput?.value.trim();
    const text = deckTextInput?.value.trim();
    if (!name || !text) {
      showImportMessage('Enter a deck name and paste a deck list first.', 'is-danger is-light');
      return;
    }

    importedDeck = Deck.fromText(name, text);
    if (importedDeck.cards.length === 0) {
      deckPreview?.classList.add('is-hidden');
      showImportMessage('No cards were found. Check that the list uses quantity, card name, set, and number.', 'is-danger is-light');
      return;
    }

    renderDeckPreview(importedDeck);
    importInputs?.classList.add('is-hidden');
    showImportMessage('Deck parsed successfully. Review the preview before saving.', 'is-success is-light');
  });

  cancelImportButton?.addEventListener('click', () => {
    importedDeck = undefined;
    importInputs?.classList.remove('is-hidden');
    deckPreview?.classList.add('is-hidden');
    showImportMessage('Import cancelled.', 'is-info is-light');
  });

  saveDeckButton?.addEventListener('click', async () => {
    if (!importedDeck) return;
    saveDeckButton.disabled = true;
    try {
      const saved = await window.api?.saveDeck({ name: importedDeck.name, cards: importedDeck.cards });
      if (!saved) throw new Error('Deck save failed');
      renderLoadedDeck(importedDeck);
      navigateTo('deck-view');
      await loadSavedDecks();
    } catch (error) {
      showImportMessage('The deck could not be saved.', 'is-danger is-light');
    } finally {
      saveDeckButton.disabled = false;
    }
  });

  backToDecksButton?.addEventListener('click', () => navigateTo('decks'));

  exportDeckPdfButton?.addEventListener('click', async () => {
    if (!loadedDeck) return;
    exportDeckPdfButton.disabled = true;
    const exported = await window.api?.exportDeckPdf({
      name: loadedDeck.name,
      text: new Deck(loadedDeck.name, loadedDeck.cards).toText(),
      preferences: currentPreferences.toObject(),
    });
    exportDeckPdfButton.disabled = false;
    exportDeckPdfButton.textContent = exported ? 'PDF exported' : 'Decklist PDF';
    if (exported) setTimeout(() => { exportDeckPdfButton.textContent = 'Decklist PDF'; }, 2500);
  });

  // 5. IPC Navigation Listener
  if (window.api?.onPageChange) {
    window.api.onPageChange((pageId) => {
      navigateTo(pageId);
    });
  }

  // 6. Settings Form Population
  function populateSettingsForm(prefs) {
    if (trainerNameEl) trainerNameEl.textContent = prefs.displayName || 'Trainer';
    if (displayNameInput) displayNameInput.value = prefs.displayName || '';
    if (firstNameInput) firstNameInput.value = prefs.firstName || '';
    if (lastNameInput) lastNameInput.value = prefs.lastName || '';
    if (dateOfBirthInput) dateOfBirthInput.value = prefs.dateOfBirth || '';
    if (playerIdInput) playerIdInput.value = prefs.playerId || '';
  }

  // 7. Initial Load
  try {
    const rawPrefs = await window.api?.getUserPreferences();
    currentPreferences = UserPreferences.fromJson(rawPrefs);
    populateSettingsForm(currentPreferences);
  } catch (error) {
    console.error('Error loading initial user preferences:', error);
  }

  // 8. Save Preferences Action
  if (settingsSaveButton) {
    settingsSaveButton.addEventListener('click', async (event) => {
      event.preventDefault();

      currentPreferences = new UserPreferences(
        displayNameInput?.value || 'Trainer',
        firstNameInput?.value || '',
        lastNameInput?.value || '',
        dateOfBirthInput?.value || '',
        playerIdInput?.value || ''
      );

      try {
        const success = await window.api?.saveUserPreferences(currentPreferences.toObject());

        if (success) {
          if (trainerNameEl) {
            trainerNameEl.textContent = currentPreferences.displayName;
          }
          console.log('Preferences successfully saved and UI updated.');

          // Show Toast inside the success block
          if (saveToast) {
            saveToast.classList.remove('is-hidden');
            setTimeout(() => {
              saveToast.classList.add('is-hidden');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    });
  }
});