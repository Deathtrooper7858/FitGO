const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'i18n', 'translations');
const sourceLang = 'es.json';
const targetLangs = ['en.json', 'fr.json', 'de.json', 'it.json', 'pt.json', 'ru.json'];

function countUntranslated(source, target, path = '') {
  let count = 0;
  for (const key in source) {
    if (typeof source[key] === 'string') {
      if (source[key] === target[key] && /[a-zA-Z]/.test(source[key])) {
        count++;
        // console.log(`Untranslated [${path ? path + '.' : ''}${key}]: ${source[key]}`);
      }
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      count += countUntranslated(source[key], target[key] || {}, path ? `${path}.${key}` : key);
    }
  }
  return count;
}

const sourceData = JSON.parse(fs.readFileSync(path.join(i18nPath, sourceLang), 'utf8'));

targetLangs.forEach(lang => {
  const targetData = JSON.parse(fs.readFileSync(path.join(i18nPath, lang), 'utf8'));
  const count = countUntranslated(sourceData, targetData);
  console.log(`${lang}: ${count} identical strings found`);
});
