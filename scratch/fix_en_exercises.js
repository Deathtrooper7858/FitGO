const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../i18n/translations/en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (en.exerciseNames) {
  for (const key in en.exerciseNames) {
    en.exerciseNames[key] = key; // The key is the English translation!
  }
}

// Clean up any root level exercises that match exerciseNames
if (en.exerciseNames) {
  for (const key in en.exerciseNames) {
    if (en[key]) {
      delete en[key];
    }
  }
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('Fixed exerciseNames in en.json');
