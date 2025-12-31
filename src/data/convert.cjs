const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'source.json');
const outputPath = path.join(__dirname, 'hsk.json');

const rawData = fs.readFileSync(sourcePath, 'utf8');
const data = JSON.parse(rawData);

const cards = data.map((entry, index) => {
    // entry structure:
    // {
    //   "simplified": "...",
    //   "level": ["new-1", "old-3"],
    //   "forms": [
    //     {
    //       "transcriptions": { "pinyin": "..." },
    //       "meanings": ["..."]
    //     }
    //   ]
    // }

    const hanzi = entry.simplified;
    // Use the first form for pinyin and meaning
    const form = entry.forms && entry.forms[0];
    const traditional = form && form.traditional || hanzi; // Fallback to simplified if no traditional
    const pinyin = form && form.transcriptions && form.transcriptions.pinyin || "";
    const meanings = form && form.meanings || [];
    const meaning = meanings.join("; ");

    const frequency = typeof entry.frequency === "number" ? entry.frequency : undefined;

    // Generate a stable ID.
    // We can use the index, but if the list changes, IDs change.
    // Using hanzi-pinyin might be better but pinyin can have spaces.
    // Let's use a simple generated ID based on index for now, or try to be smarter.
    // The sample used "hsk3-001".
    // Let's use "hsk-{index}"
    const id = `hsk-${String(index).padStart(5, '0')}`;

    return {
        id,
        hanzi,
        traditional,
        pinyin,
        meaning,
        frequency,
        level: entry.level || [],
        pos: entry.pos || []
    };
});

// Extract unique radicals
const radicalsSet = new Set();
data.forEach(entry => {
    if (entry.radical) {
        radicalsSet.add(entry.radical);
    }
});

// Create radical cards
const radicalCards = Array.from(radicalsSet).map((radicalChar, index) => {
    // Check if this radical exists as a normal card to reuse pinyin/meaning
    const existingCard = cards.find(c => c.hanzi === radicalChar);
    
    let pinyin = "";
    let meaning = "Radical";
    let traditional = radicalChar;

    if (existingCard) {
        pinyin = existingCard.pinyin;
        meaning = existingCard.meaning + " (Radical)";
        traditional = existingCard.traditional;
    }

    return {
        id: `radical-${String(index).padStart(3, '0')}`,
        hanzi: radicalChar,
        traditional: traditional,
        pinyin: pinyin,
        meaning: meaning,
        level: ["radical"],
        pos: []
    };
});

// Keep radicals available, but avoid them appearing first and "clogging" normal word flow
// when users include both radicals and full words.
const finalCards = [...cards, ...radicalCards];

fs.writeFileSync(outputPath, JSON.stringify(finalCards, null, 2));
console.log(`Converted ${cards.length} words and ${radicalCards.length} radicals to ${outputPath}`);
