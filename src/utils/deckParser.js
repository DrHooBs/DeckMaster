export function parseDeckList(text) {
  const lines = text.split(/\r?\n/);
  const cards = [];

  let currentCardType = null;

  // Regex patterns:
  // 1. Matches headers like "Pokémon: 19", "Trainer: 33", "Energy: 8"
  const headerRegex = /^([A-Za-z\u00C0-\u024F]+):\s*\d+$/;

  // 2. Captures: [1: Qty] [2: Card Name] [3: Set] [4: Number]
  const cardRegex = /^(\d+)\s+(.+)\s+([A-Z0-9]+)\s+(\d+)$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for section header
    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      currentCardType = headerMatch[1];
      continue;
    }

    // Check for card line
    const cardMatch = line.match(cardRegex);
    if (cardMatch) {
      cards.push({
        qty: parseInt(cardMatch[1], 10),
        cardName: cardMatch[2].trim(),
        set: cardMatch[3],
        number: parseInt(cardMatch[4], 10), // or string if preserving leading zeros/formatting
        cardType: currentCardType
      });
    }
  }

  return cards;
}
