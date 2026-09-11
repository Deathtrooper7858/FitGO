const fs = require('fs');
const path = require('path');
const { translate } = require('google-translate-api-x');

const EXERCISES_FILE = path.join(__dirname, '../excercise/exercises.json');
const CACHE_FILE = path.join(__dirname, '../excercise/temp_steps_es.json');
const OUTPUT_FILE = path.join(__dirname, '../excercise/instructions_es.json');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const exercises = JSON.parse(fs.readFileSync(EXERCISES_FILE, 'utf8'));
  console.log(`Loaded ${exercises.length} exercises.`);

  // Load existing cache if any
  let stepCache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      stepCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`Loaded ${Object.keys(stepCache).length} cached steps from ${CACHE_FILE}`);
    } catch (e) {
      console.warn('Could not load cache:', e.message);
    }
  }

  // Extract all unique clean steps
  const uniqueSteps = new Set();
  exercises.forEach(ex => {
    (ex.instructions || []).forEach(step => {
      const clean = step.replace(/^Step:\s*\d+\s*/i, '').trim();
      if (clean) uniqueSteps.add(clean);
    });
  });

  const stepsToTranslate = Array.from(uniqueSteps).filter(step => !stepCache[step]);
  console.log(`Total unique steps: ${uniqueSteps.size}. Remaining to translate: ${stepsToTranslate.length}`);

  const BATCH_SIZE = 80;
  for (let i = 0; i < stepsToTranslate.length; i += BATCH_SIZE) {
    const batch = stepsToTranslate.slice(i, i + BATCH_SIZE);
    let success = false;
    let retries = 3;

    while (!success && retries > 0) {
      try {
        const res = await translate(batch, { to: 'es' });
        const results = Array.isArray(res) ? res : [res];
        batch.forEach((original, idx) => {
          stepCache[original] = results[idx]?.text || original;
        });
        success = true;
      } catch (err) {
        retries--;
        console.warn(`Error on batch ${i} - ${i + batch.length} (${err.message}). Retries left: ${retries}`);
        await sleep(2000);
      }
    }

    if (!success) {
      console.error(`Failed batch starting at ${i}, continuing...`);
    }

    // Save cache periodically
    if (i % (BATCH_SIZE * 5) === 0 || i + BATCH_SIZE >= stepsToTranslate.length) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(stepCache, null, 2), 'utf8');
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, stepsToTranslate.length)} / ${stepsToTranslate.length} steps cached.`);
    }

    await sleep(250);
  }

  // Final cache save
  fs.writeFileSync(CACHE_FILE, JSON.stringify(stepCache, null, 2), 'utf8');

  // Build final instructions_es.json mapping exerciseId -> array of translated instructions
  const finalMapping = {};
  exercises.forEach(ex => {
    const translatedInstructions = (ex.instructions || []).map(step => {
      const clean = step.replace(/^Step:\s*\d+\s*/i, '').trim();
      return stepCache[clean] || clean;
    });
    finalMapping[ex.exerciseId] = translatedInstructions;
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalMapping), 'utf8');
  console.log(`Successfully generated ${OUTPUT_FILE} with ${Object.keys(finalMapping).length} exercises!`);

  // Clean up temp file
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
