const { default: TCGdex } = require('@tcgdex/sdk');

const tcgdex = new TCGdex("en");

// In-memory cache for mapping printed codes (tcgOnline) to TCGdex internal set IDs
let setCodeCache = null;


//TODO: There has to be a better way of doing this
// Look at CalamityJames/Zardy implementation because i did it there
const printedSetIds = {
    SVI: 'sv01', PAL: 'sv02', OBF: 'sv03', MEW: 'sv03.5', PAR: 'sv04',
    PAF: 'sv04.5', TEF: 'sv05', TWM: 'sv06', SFA: 'sv06.5', SCR: 'sv07',
    SSP: 'sv08', PRE: 'sv08.5', JTG: 'sv09', DRI: 'sv10', WHT: 'sv10.5w',
    BLK: 'sv10.5b', MEG: 'me01'
};

/**
 * Initializes and caches the map of printed set codes (e.g., 'MEG', 'ASC', 'OBF')
 * to internal TCGdex IDs (e.g., 'me01', 'me02.5', 'sv03').
 */
async function loadSetCodeMap() {
    if (setCodeCache) return setCodeCache;

    try {
        const sets = await tcgdex.set.list();
        const map = new Map();

        for (const set of sets) {
            // Map the official printed / PTCGO / PTCGL code
            if (set.tcgOnline) {
                map.set(set.tcgOnline.toUpperCase(), set.id);
            }
            // Map the internal set ID as well for direct fallback
            map.set(set.id.toUpperCase(), set.id);
        }

        setCodeCache = map;
        return setCodeCache;
    } catch (error) {
        console.error("Failed to load set code cache:", error.message);
        return new Map();
    }
}

/**
 * Resolves a printed set code or internal ID to a valid TCGdex set ID.
 * @param {string} inputCode - Printed code ('MEG', 'ASC') or internal ID ('me01', 'sv03').
 * @returns {Promise<string>} Resolved TCGdex set ID.
 */
async function resolveSetId(inputCode) {
    const map = await loadSetCodeMap();
    const normalized = inputCode.trim().toUpperCase();
    return map.get(normalized) || printedSetIds[normalized] || inputCode.toLowerCase();
}

/**
 * Fetches the card image URL by printed set code and card number.
 * @param {string} setCode - Printed card set code (e.g., 'MEG', 'ASC', 'PAF') or internal ID.
 * @param {string|number} localId - The card number within the set (e.g., '1', '001', '4a').
 * @param {'high'|'low'} [quality='high'] - Image quality.
 * @param {'png'|'webp'|'jpg'} [format='png'] - Image format.
 * @returns {Promise<string|null>} The image URL, or null if not found.
 */
async function getCardImageUrl(setCode, localId, quality = 'high', format = 'png') {
    try {
        const setId = await resolveSetId(setCode);
        const card = await tcgdex.fetch('sets', setId, localId);

        if (!card || !card.image) {
            return null;
        }

        return `${card.image}/${quality}.${format}`;
    } catch (error) {
        console.error(`Failed to fetch card ${setCode}/${localId}:`, error.message);
        return null;
    }
}

module.exports = { getCardImageUrl };