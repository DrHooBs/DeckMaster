import { UserPreferences } from '../classes/UserPreferences.js';

export function createSettingsView({ displayNameInput, firstNameInput, lastNameInput, dateOfBirthInput, playerIdInput, trainerNameEl, api }) {
  let currentPreferences;

  function populate(preferences) {
    currentPreferences = preferences;
    if (trainerNameEl) trainerNameEl.textContent = preferences.displayName || 'Trainer';
    if (displayNameInput) displayNameInput.value = preferences.displayName || '';
    if (firstNameInput) firstNameInput.value = preferences.firstName || '';
    if (lastNameInput) lastNameInput.value = preferences.lastName || '';
    if (dateOfBirthInput) dateOfBirthInput.value = preferences.dateOfBirth || '';
    if (playerIdInput) playerIdInput.value = preferences.playerId || '';
  }

  async function save() {
    currentPreferences = new UserPreferences(
      displayNameInput?.value || 'Trainer',
      firstNameInput?.value || '',
      lastNameInput?.value || '',
      dateOfBirthInput?.value || '',
      playerIdInput?.value || ''
    );
    const success = await api?.saveUserPreferences(currentPreferences.toObject());
    if (success && trainerNameEl) trainerNameEl.textContent = currentPreferences.displayName;
    return success;
  }

  return { populate, save, get preferences() { return currentPreferences; } };
}
