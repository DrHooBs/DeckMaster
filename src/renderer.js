import { UserPreferences } from './classes/UserPreferences.js';

window.addEventListener('DOMContentLoaded', async () => {
  const burgerButton = document.querySelector('#burger-button');
  const navbarMenu = document.querySelector('#navbar-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');
  const newDeckButton = document.querySelector('#new-deck');
  const settingsSaveButton = document.querySelector('#save-btn');
  const trainerNameEl = document.getElementById('trainer-name');

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
        dateOfBirthInput?.value || ''
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