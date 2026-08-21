import { UserPreferences } from './classes/UserPreferences.js';
import { Deck } from './classes/Deck.js';
import { renderCardRows } from './renderer/cardRows.js';
import { createDeckListView } from './renderer/deckListView.js';
import { createSettingsView } from './renderer/settingsView.js';
import { createImportView } from './renderer/importView.js';

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

  let deckToDelete;
  let loadedDeck;
  const settingsView = createSettingsView({
    displayNameInput: document.getElementById('display-name'),
    firstNameInput: document.getElementById('first-name'),
    lastNameInput: document.getElementById('last-name'),
    dateOfBirthInput: document.getElementById('date-of-birth'),
    playerIdInput: document.getElementById('player-id'),
    trainerNameEl,
    api: window.api,
  });
  let deckListView;
  let importView;

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

    if (pageId === 'decks') deckListView?.load();

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

  importView = createImportView({
    deckNameInput, deckTextInput, importMessage, deckPreview, deckSummary, deckCards,
    pasteDeckButton, parseDeckButton, cancelImportButton, importInputs, saveDeckButton,
    api: window.api, navigateTo, renderLoadedDeck, refreshDecks: () => deckListView?.load(), renderCardRows,
  });

  function renderLoadedDeck(deck) {
    if (!loadedDeckName || !loadedDeckSummary || !loadedDeckCards) return;
    loadedDeck = deck;
    loadedDeckName.textContent = deck.name;
    loadedDeckSummary.textContent = `${deck.cards.length} card entries, ${deck.cards.reduce((total, card) => total + card.qty, 0)} cards total.`;
    renderCardRows(loadedDeckCards, deck, window.api, {
      allowCover: true,
      onCoverSelected: async (selectedDeck) => {
        if (await window.api?.saveDeck(selectedDeck)) {
          renderLoadedDeck(selectedDeck);
          await deckListView?.load();
        }
      },
    });
  }

  function closeDeleteModal() {
    deleteModal?.classList.remove('is-active');
    deckToDelete = undefined;
  }

  deckListView = createDeckListView({
    savedDecks,
    noDecks,
    api: window.api,
    navigateTo,
    renderLoadedDeck,
    openDeleteModal: (deck) => {
      deckToDelete = deck;
      deleteDeckName.textContent = deck.name;
      deleteNameInput.value = '';
      deleteError.classList.add('is-hidden');
      confirmDeleteButton.disabled = true;
      deleteModal.classList.add('is-active');
      deleteNameInput.focus();
    },
  });

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
      await deckListView?.load();
    } else {
      confirmDeleteButton.disabled = false;
      deleteError.textContent = 'The deck could not be deleted.';
      deleteError.classList.remove('is-hidden');
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

  // 7. Initial Load
  try {
    const rawPrefs = await window.api?.getUserPreferences();
    currentPreferences = UserPreferences.fromJson(rawPrefs);
    settingsView.populate(currentPreferences);
  } catch (error) {
    console.error('Error loading initial user preferences:', error);
  }

  // 8. Save Preferences Action
  if (settingsSaveButton) {
    settingsSaveButton.addEventListener('click', async (event) => {
      event.preventDefault();

      try {
        const success = await settingsView.save();

        if (success) {
          currentPreferences = settingsView.preferences;
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