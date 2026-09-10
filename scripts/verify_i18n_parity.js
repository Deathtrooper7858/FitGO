const fs = require('fs');
const path = require('path');

const transDir = path.join(__dirname, '..', 'i18n', 'translations');
const langs = ['es', 'en', 'fr', 'pt', 'it', 'de', 'ru'];

function countKeys(obj) {
  let count = 0;
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      count += countKeys(obj[k]);
    } else {
      count++;
    }
  }
  return count;
}

function findMissing(source, target, pathArr = [], missing = []) {
  for (const k in source) {
    const current = [...pathArr, k];
    if (typeof source[k] === 'object' && source[k] !== null && !Array.isArray(source[k])) {
      findMissing(source[k], (target && target[k]) ? target[k] : {}, current, missing);
    } else {
      if (!target || target[k] === undefined) {
        missing.push(current.join('.'));
      }
    }
  }
  return missing;
}

function verify() {
  const esPath = path.join(transDir, 'es.json');
  const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
  const esCount = countKeys(esData);

  console.log(`\n========================================`);
  console.log(`i18n PARITY VERIFICATION REPORT`);
  console.log(`Master (es.json) total leaf keys: ${esCount}`);
  console.log(`========================================\n`);

  let allPassed = true;

  for (const lang of langs) {
    const p = path.join(transDir, `${lang}.json`);
    if (!fs.existsSync(p)) {
      console.error(`❌ [${lang}] File does not exist!`);
      allPassed = false;
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const count = countKeys(data);
      const missing = findMissing(esData, data);

      if (missing.length === 0 && count === esCount) {
        console.log(`✅ [${lang}.json]: 100% PARITY! Keys: ${count}/${esCount} | Missing: 0`);
      } else {
        console.warn(`⚠️ [${lang}.json]: Keys: ${count}/${esCount} | Missing keys: ${missing.length}`);
        if (missing.length > 0 && missing.length <= 10) {
          console.warn(`   Missing: ${missing.join(', ')}`);
        } else if (missing.length > 10) {
          console.warn(`   First 10 missing: ${missing.slice(0, 10).join(', ')}...`);
        }
        allPassed = false;
      }
    } catch (e) {
      console.error(`❌ [${lang}.json]: JSON parse error: ${e.message}`);
      allPassed = false;
    }
  }

  // Check French critical keys for the user
  console.log('\n--- French Verification ---');
  const frData = JSON.parse(fs.readFileSync(path.join(transDir, 'fr.json'), 'utf8'));
  const checks = [
    ['planner.today', frData.planner?.today],
    ['planner.tue', frData.planner?.tue],
    ['planner.safetyNoticeTitle', frData.planner?.safetyNoticeTitle],
    ['planner.shoppingListShort', frData.planner?.shoppingListShort],
    ['planner.pdfMenu', frData.planner?.pdfMenu],
    ['planner.pdfRoutine', frData.planner?.pdfRoutine],
    ['planner.recipe', frData.planner?.recipe],
    ['planner.swap', frData.planner?.swap],
    ['muscleDirectory.secondaryMuscles', frData.muscleDirectory?.secondaryMuscles],
    ['muscleDirectory.instructions', frData.muscleDirectory?.instructions],
    ['evaluation.heroTitle', frData.evaluation?.heroTitle],
    ['recipes.chefBadge', frData.recipes?.chefBadge]
  ];

  for (const [key, val] of checks) {
    console.log(`  ${key}: "${val}"`);
  }

  console.log('\n========================================');
  if (allPassed) {
    console.log('🎉 ALL LANGUAGES VERIFIED WITH 100% PARITY!');
  } else {
    console.log('⚠️ Some files still have missing keys or discrepancies.');
  }
  console.log('========================================\n');
}

verify();
