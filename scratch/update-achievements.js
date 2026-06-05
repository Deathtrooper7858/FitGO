const fs = require('fs');
const path = require('path');

const tsContent = fs.readFileSync(path.join(__dirname, '../hooks/useAchievements.ts'), 'utf-8');

const badges = {};
const items = {};

// Parse ALL_BADGES
const badgesRegex = /id:\s*'([^']+)',\s*label:\s*'([^']+)',[\s\S]*?description:\s*'([^']+)'/g;
let match;
while ((match = badgesRegex.exec(tsContent)) !== null) {
    badges[match[1]] = { label: match[2], description: match[3] };
}

// Parse achievements array
const achievementsRegex = /{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*description:\s*'([^']+)'/g;
while ((match = achievementsRegex.exec(tsContent)) !== null) {
    items[match[1]] = { title: match[2], description: match[3] };
}

console.log(`Parsed ${Object.keys(badges).length} badges and ${Object.keys(items).length} items.`);

const langs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru'];
const dir = path.join(__dirname, '../i18n/translations');

for (const lang of langs) {
    const file = path.join(dir, `${lang}.json`);
    if (fs.existsSync(file)) {
        const json = JSON.parse(fs.readFileSync(file, 'utf-8'));
        
        if (!json.achievements) json.achievements = {};
        
        // Fix string collision
        if (typeof json.achievements.badges === 'string') {
            json.achievements.badgesTitle = json.achievements.badges;
            json.achievements.badges = {};
        }

        if (!json.achievements.badges) json.achievements.badges = {};
        if (!json.achievements.items) json.achievements.items = {};
        if (!json.common) json.common = {};

        // Merge badges
        for (const [id, data] of Object.entries(badges)) {
            if (!json.achievements.badges[id]) json.achievements.badges[id] = {};
            if (!json.achievements.badges[id].label) json.achievements.badges[id].label = data.label;
            if (!json.achievements.badges[id].description) json.achievements.badges[id].description = data.description;
        }

        // Merge items
        for (const [id, data] of Object.entries(items)) {
            if (!json.achievements.items[id]) json.achievements.items[id] = {};
            if (!json.achievements.items[id].title) json.achievements.items[id].title = data.title;
            if (!json.achievements.items[id].description) json.achievements.items[id].description = data.description;
        }

        // Add camera and gallery to common if missing
        const commonDefaults = {
            camera: 'Cámara',
            gallery: 'Galería',
            cameraPermissionDenied: 'Se necesita permiso para la cámara.',
            galleryPermissionDenied: 'Se necesita permiso para la galería.'
        };

        for (const [key, val] of Object.entries(commonDefaults)) {
            if (!json.common[key]) {
                json.common[key] = val;
            }
        }

        fs.writeFileSync(file, JSON.stringify(json, null, 2));
        console.log(`Updated ${lang}.json`);
    }
}
