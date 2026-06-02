const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'i18n', 'translations');
const sourceLang = 'es.json';
const targetLangs = ['en.json', 'fr.json', 'de.json', 'it.json', 'pt.json', 'ru.json'];

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMerge(target, source) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        if (!(key in target)) {
          output[key] = source[key];
        }
      }
    });
  }
  return output;
}

try {
  const sourceData = JSON.parse(fs.readFileSync(path.join(i18nPath, sourceLang), 'utf8'));

  targetLangs.forEach(lang => {
    const langPath = path.join(i18nPath, lang);
    let targetData = {};
    if (fs.existsSync(langPath)) {
      try {
        targetData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
      } catch (e) {
        console.error(`Error parsing ${lang}, starting fresh.`);
      }
    }
    
    // Merge: targetData gets missing keys from sourceData
    const mergedData = deepMerge(targetData, sourceData);
    
    // Sort keys alphabetically for consistency (optional, but good)
    fs.writeFileSync(langPath, JSON.stringify(mergedData, null, 2));
    console.log(`Synced ${lang} successfully.`);
  });
  console.log('All translations synced!');
} catch (err) {
  console.error('Error syncing translations:', err);
}
