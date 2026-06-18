const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'i18n', 'translations');
const sourceLang = 'es.json';
const targetLangs = ['it.json', 'pt.json', 'ru.json']; // Only processing the remaining ones

// Helper to check if string has letters
function hasLetters(str) {
  return /[a-zA-Z]/.test(str);
}

// Function to find all untranslated paths
function findUntranslated(source, target, pathArr = [], untranslatedList = []) {
  for (const key in source) {
    const currentPath = [...pathArr, key];
    if (typeof source[key] === 'string') {
      if (target[key] === source[key] && hasLetters(source[key])) {
        if (source[key] !== 'FitGo' && source[key] !== 'Fitz' && source[key] !== 'Premium') {
          untranslatedList.push({ path: currentPath, text: source[key] });
        }
      }
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      findUntranslated(source[key], target[key], currentPath, untranslatedList);
    }
  }
  return untranslatedList;
}

// Function to set value by path
function setByPath(obj, pathArr, value) {
  let current = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (!current[pathArr[i]]) current[pathArr[i]] = {};
    current = current[pathArr[i]];
  }
  current[pathArr[pathArr.length - 1]] = value;
}

async function run() {
  const { translate } = await import('@vitalets/google-translate-api');
  
  const sourceData = JSON.parse(fs.readFileSync(path.join(i18nPath, sourceLang), 'utf8'));

  for (const langFile of targetLangs) {
    const langCode = langFile.replace('.json', '');
    console.log(`\n--- Processing ${langCode} ---`);
    
    const langPath = path.join(i18nPath, langFile);
    let targetData = {};
    if (fs.existsSync(langPath)) {
      targetData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    }

    const untranslatedList = findUntranslated(sourceData, targetData);
    console.log(`Found ${untranslatedList.length} items to translate for ${langCode}`);

    if (untranslatedList.length === 0) continue;

    const chunkSize = 50;
    
    for (let i = 0; i < untranslatedList.length; i += chunkSize) {
      const chunk = untranslatedList.slice(i, i + chunkSize);
      const textsToTranslate = chunk.map(item => item.text);
      const joined = textsToTranslate.join(' ||| ');

      let success = false;
      let retries = 0;
      
      while (!success && retries < 3) {
        try {
          const res = await translate(joined, { to: langCode });
          const translatedArray = res.text.split(/\|\|\|/i).map(s => s.trim());

          for (let j = 0; j < chunk.length; j++) {
            const original = chunk[j];
            let translation = translatedArray[j] || original.text;
            translation = translation.replace(/\s+([.,!?])/g, '$1');
            setByPath(targetData, original.path, translation);
          }

          console.log(`Translated ${Math.min(i + chunkSize, untranslatedList.length)} / ${untranslatedList.length}`);
          fs.writeFileSync(langPath, JSON.stringify(targetData, null, 2));
          success = true;

          // Huge sleep to avoid rate limits
          await new Promise(r => setTimeout(r, 6000));
        } catch (err) {
          retries++;
          console.error(`Error translating chunk. Retry ${retries}/3. Message:`, err.message);
          if (retries >= 3) {
            console.error('Giving up on this language to avoid IP ban.');
            break;
          }
          await new Promise(r => setTimeout(r, 15000)); // wait 15 seconds before retry
        }
      }
      
      if (!success) {
         break; // Stop processing current language if max retries failed
      }
    }
  }
  console.log('All done!');
}

run().catch(console.error);
