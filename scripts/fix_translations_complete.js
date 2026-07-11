const fs = require('fs');
const path = require('path');

const TRANS_DIR = path.join(__dirname, '..', 'i18n', 'translations');
const ref = JSON.parse(fs.readFileSync(path.join(TRANS_DIR, 'en.json'), 'utf-8'));

function getKeysFlat(obj, prefix) {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? prefix + '.' + k : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      getKeysFlat(v, p).forEach(sk => keys.add(sk));
    } else {
      keys.add(p);
    }
  }
  return keys;
}

function delKeys(obj, keysToDelete, prefix) {
  for (const k of Object.keys(obj)) {
    const p = prefix ? prefix + '.' + k : k;
    if (keysToDelete.has(p)) {
      delete obj[k];
    } else if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      delKeys(obj[k], keysToDelete, p);
      if (Object.keys(obj[k]).length === 0) delete obj[k];
    }
  }
}

function addMissingKeys(refObj, targetObj, prefix) {
  for (const [k, v] of Object.entries(refObj)) {
    const p = prefix ? prefix + '.' + k : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      if (!targetObj[k] || typeof targetObj[k] !== 'object') {
        targetObj[k] = {};
      }
      addMissingKeys(v, targetObj[k], p);
    } else if (!(k in targetObj)) {
      targetObj[k] = v;
    }
  }
}

const refKeys = getKeysFlat(ref);
const langs = ['fr', 'pt', 'it', 'de', 'ru'];

for (const lang of langs) {
  const filePath = path.join(TRANS_DIR, lang + '.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const dataKeys = getKeysFlat(data);
  
  const extraKeys = new Set([...dataKeys].filter(k => !refKeys.has(k)));
  const missingKeys = new Set([...refKeys].filter(k => !dataKeys.has(k)));
  
  // Remove extra keys
  delKeys(data, extraKeys);
  
  // Add missing keys from English
  addMissingKeys(ref, data, '');
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  
  console.log(`${lang}: removed ${extraKeys.size} extra keys, added ${missingKeys.size} missing keys`);
}

// Also fix web translations
const WEB_TRANS_DIR = path.join(__dirname, '..', 'i18n', 'web-translations');
const webRef = JSON.parse(fs.readFileSync(path.join(WEB_TRANS_DIR, 'en.json'), 'utf-8'));
const webRefKeys = getKeysFlat(webRef);
const webLangs = ['es', 'fr', 'pt', 'it', 'de', 'ru'];

for (const lang of webLangs) {
  const filePath = path.join(WEB_TRANS_DIR, lang + '.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const dataKeys = getKeysFlat(data);
  
  const extraKeys = new Set([...dataKeys].filter(k => !webRefKeys.has(k)));
  const missingKeys = new Set([...webRefKeys].filter(k => !dataKeys.has(k)));
  
  delKeys(data, extraKeys);
  addMissingKeys(webRef, data, '');
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  
  console.log(`web ${lang}: removed ${extraKeys.size} extra keys, added ${missingKeys.size} missing keys`);
}

console.log('\nTranslation fix complete.');
