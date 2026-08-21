import parseDeckList from './utils/deckParser.js';

export class Deck {
    constructor(name, cards = []) {
        this.name = name;
        this.cards = cards; // Array of card PJSO's
    }

    static fromText(name, text) {
        const cards = parseDeckList(text);
        return new Deck(name, cards);
    }
    
    toText() {
        // Convert the deck back to a text representation, grouped by card type.
        // This **should** be compatible with PTCGO (in theory)
        const sections = new Map();

        this.cards.forEach(card => {
            const type = card.cardType === 'Pokémon' ? 'Pokemon' : card.cardType;
            if (!sections.has(type)) {
                sections.set(type, { total: 0, cards: [] });
            }

            const section = sections.get(type);
            section.total += Number(card.qty) || 0;
            section.cards.push(card);
        });

        return [...sections.entries()].map(([type, section]) => [
            `${type}:${section.total}`,
            ...section.cards.map(card => `${card.qty} ${card.cardName} ${card.set} ${card.number}`)
        ].join('\n')).join('\n\n');
    }

}