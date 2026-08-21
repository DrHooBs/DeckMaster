const path = require('node:path');

function createPaths(app) {
  const userData = app.getPath('userData');
  return {
    prefsDir: userData,
    prefsFile: path.join(userData, 'userPreferences.json'),
    decksDir: path.join(userData, 'Decks'),
    iconPath: path.join(__dirname, '../../build/icons/png/512x512.png'),
  };
}

module.exports = { createPaths };
