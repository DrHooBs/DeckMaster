const https = require('node:https');
const fs = require('node:fs/promises');
const { PDFDocument, StandardFonts } = require('pdf-lib');

const TEMPLATE_URL = 'https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-deck-list-85x11.pdf';

function downloadPdf(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadPdf(new URL(response.headers.location, url).toString()).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Deck-list template returned HTTP ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

function normalizedFieldName(field) {
  return field.getName().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fillTextField(field, value) {
  if (typeof field.setText === 'function' && value) field.setText(String(value));
}

function createPdfExporter() {
  return {
    async export(ownerWindow, deckData, dialog) {
      const name = String(deckData?.name || '').trim();
      const deckText = String(deckData?.text || '').trim();
      if (!name || !deckText) return false;
      const { canceled, filePath } = await dialog.showSaveDialog(ownerWindow, {
        title: 'Export decklist PDF',
        defaultPath: `${name.replace(/[^a-z0-9 _-]/gi, '').trim() || 'decklist'}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (canceled || !filePath) return false;

      try {
        const document = await PDFDocument.load(await downloadPdf(TEMPLATE_URL));
        const form = document.getForm();
        const preferences = deckData.preferences || {};
        const fullName = [preferences.firstName, preferences.lastName].filter(Boolean).join(' ') || preferences.displayName;
        const cardLines = deckText.split('\n');
        form.getFields().forEach((field) => {
          const fieldName = normalizedFieldName(field);
          if (fieldName.includes('playerid')) fillTextField(field, preferences.playerId);
          else if (fieldName.includes('displayname') || fieldName === 'name' || fieldName.includes('playername')) fillTextField(field, fullName);
          else if (fieldName.includes('firstname')) fillTextField(field, preferences.firstName);
          else if (fieldName.includes('lastname')) fillTextField(field, preferences.lastName);
          else if (fieldName.includes('dateofbirth') || fieldName === 'dob' || fieldName.includes('birth')) fillTextField(field, preferences.dateOfBirth);
          else if (fieldName.includes('deckname') || fieldName === 'deck') fillTextField(field, name);
          else if (fieldName.includes('decklist') || fieldName.includes('cardlist')) fillTextField(field, deckText);
          else {
            const rowMatch = fieldName.match(/(?:card|pokemon|trainer|energy|list)(\d+)/);
            if (rowMatch) fillTextField(field, cardLines[Number(rowMatch[1]) - 1]);
          }
        });
        form.updateFieldAppearances(await document.embedFont(StandardFonts.Helvetica));
        form.flatten();
        await fs.writeFile(filePath, await document.save());
        return true;
      } catch (error) {
        console.error('Error exporting deck PDF:', error);
        return false;
      }
    },
  };
}

module.exports = { createPdfExporter, TEMPLATE_URL };
