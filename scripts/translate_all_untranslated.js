const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'i18n', 'translations');
const sourceFile = path.join(i18nPath, 'es.json');

const targetConfigs = [
  { code: 'pt', file: 'pt.json' },
  { code: 'it', file: 'it.json' },
  { code: 'ru', file: 'ru.json' }
];

const ignoreList = new Set([
  'FitGo', 'FitGO', 'Fitz', 'Premium', 'Pro', 'kcal', 'kg', 'cm', 'ml', 'lbs', 'ft',
  'VIP', 'VIP Diamond', 'VIP Gold', 'VIP Elite', 'TikTok', 'Instagram', 'WhatsApp',
  'CrossFit', 'Pilates', 'Yoga', 'Zumba', 'Cardio', 'Powerlifting', 'Golf', 'Pádel'
]);

function isIgnored(val) {
  if (ignoreList.has(val.trim())) return true;
  if (/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(val)) return true;
  return false;
}

function findUntranslated(source, target, pathArr = [], list = []) {
  for (const key in source) {
    const currentPath = [...pathArr, key];
    if (typeof source[key] === 'string') {
      const srcVal = source[key];
      const tgtVal = target[key];

      if (srcVal === tgtVal && /[a-zA-Z]/.test(srcVal) && !isIgnored(srcVal)) {
        list.push({ path: currentPath, text: srcVal });
      }
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      findUntranslated(source[key], target[key] || {}, currentPath, list);
    }
  }
  return list;
}

function setByPath(obj, pathArr, value) {
  let current = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (!current[pathArr[i]] || typeof current[pathArr[i]] !== 'object') {
      current[pathArr[i]] = {};
    }
    current = current[pathArr[i]];
  }
  current[pathArr[pathArr.length - 1]] = value;
}

function protectVariables(text) {
  const vars = [];
  const tokenized = text.replace(/\{\{([^{}]+)\}\}/g, (_, v) => {
    vars.push(v);
    return `XZQ_${vars.length - 1}_ZQX`;
  });
  return { tokenized, vars };
}

function restoreVariables(text, vars) {
  let res = text;
  vars.forEach((v, i) => {
    const regex = new RegExp(`XZQ_${i}_ZQX`, 'gi');
    res = res.replace(regex, `{{${v}}}`);
  });
  return res;
}

async function run() {
  const { translate } = await import('google-translate-api-x');
  const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

  for (const { code, file } of targetConfigs) {
    const targetPath = path.join(i18nPath, file);
    let targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

    const untranslated = findUntranslated(sourceData, targetData);
    console.log(`\n========================================`);
    console.log(`Processing ${file} (${code}) — Untranslated count: ${untranslated.length}`);
    console.log(`========================================`);

    if (untranslated.length === 0) continue;

    const chunkSize = 20;

    for (let i = 0; i < untranslated.length; i += chunkSize) {
      const chunk = untranslated.slice(i, i + chunkSize);
      
      const preparedList = chunk.map(item => protectVariables(item.text));
      const joinedTokenized = preparedList.map(p => p.tokenized).join(' ||| ');

      let success = false;
      let retries = 0;

      while (!success && retries < 4) {
        try {
          const res = await translate(joinedTokenized, { from: 'es', to: code });
          const parts = res.text.split(/\|\|\|/);

          if (parts.length === chunk.length) {
            for (let j = 0; j < chunk.length; j++) {
              const cleanedPart = parts[j].trim();
              const restored = restoreVariables(cleanedPart, preparedList[j].vars);
              setByPath(targetData, chunk[j].path, restored);
            }
          } else {
            // Delimiter count mismatch: fallback to translating items individually
            for (let j = 0; j < chunk.length; j++) {
              const singleRes = await translate(preparedList[j].tokenized, { from: 'es', to: code });
              const restored = restoreVariables(singleRes.text.trim(), preparedList[j].vars);
              setByPath(targetData, chunk[j].path, restored);
              await new Promise(r => setTimeout(r, 120));
            }
          }

          fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2), 'utf8');
          success = true;
          const currentProgress = Math.min(i + chunkSize, untranslated.length);
          console.log(`[${code}] Translated ${currentProgress} / ${untranslated.length} (${Math.round((currentProgress / untranslated.length) * 100)}%)`);

          // Small delay between chunks to avoid rate limiting
          await new Promise(r => setTimeout(r, 600));
        } catch (err) {
          retries++;
          console.warn(`[${code}] Chunk error (retry ${retries}/4):`, err.message);
          if (retries >= 4) {
            console.error(`[${code}] Failed after 4 retries on chunk starting at index ${i}. Continuing to next.`);
            break;
          }
          await new Promise(r => setTimeout(r, 4000 * retries));
        }
      }
    }

    console.log(`Finished processing ${file}!`);
  }

  console.log('\nAll languages translated successfully!');
}

run().catch(console.error);
