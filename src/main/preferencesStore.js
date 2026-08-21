const fs = require('node:fs/promises');
const { UserPreferences } = require('../classes/UserPreferences');

function createPreferencesStore(filePath) {
  return {
    async get() {
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        return UserPreferences.fromJson(data).toObject();
      } catch (error) {
        if (error.code !== 'ENOENT') console.error('Error reading preferences:', error);
        const defaults = new UserPreferences();
        await fs.writeFile(filePath, defaults.toJson(), 'utf-8');
        return defaults.toObject();
      }
    },

    async save(data) {
      try {
        const preferences = UserPreferences.fromJson(data);
        await fs.writeFile(filePath, preferences.toJson(), 'utf-8');
        return true;
      } catch (error) {
        console.error('Error saving preferences:', error);
        return false;
      }
    },
  };
}

module.exports = { createPreferencesStore };
