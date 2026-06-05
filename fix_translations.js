/**
 * Fix translation script for FitGo
 * 
 * This script:
 * 1. Reads the Spanish (es.json) source file as ground truth
 * 2. Reads each target language file
 * 3. For each key that exists in target but has the SAME value as es.json,
 *    it marks it as needing translation (only fixes specific known issues)
 * 4. Specifically fixes known hardcoded Spanish values that ended up in en.json
 */

const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'i18n', 'translations');

// Known English translations for values that were incorrectly set to Spanish
// These are specific to en.json corrections
const enFixes = {
  profile: {
    changeToKg: 'Change to kg',
    changeToLbs: 'Change to lbs',
    changeToCm: 'Change to cm',
    changeToFt: 'Change to ft',
    noneSelected: 'None selected',
    editHealthProfile: 'Edit Health Profile',
    importData: 'Import Data',
    exportData: 'Export Data (Excel)',
    restoreSubscription: 'Restore subscription',
    userId: 'User ID',
    updateEmailPassword: 'Update email or password',
    terms: 'Terms of Service',
    others: 'Others',
    idCopied: 'ID copied to clipboard',
    selectBadgeSubtitle: 'Choose the badge you want to highlight on your public profile.',
  },
  common: {
    slogan: 'Your best version',
  },
  onboarding: {
    foodItems: {
      // Common foods - these got Spanish values
      salmon: 'Salmon',
      tuna: 'Tuna',
      greek_yogurt: 'Greek Yogurt',
      cottage_cheese: 'Cottage Cheese',
      tempeh: 'Tempeh',
      lamb: 'Lamb',
      sardines: 'Sardines',
      crab: 'Crab',
      octopus: 'Octopus',
      tilapia: 'Tilapia',
      duck: 'Duck',
      bison: 'Bison',
      venison: 'Venison',
      skyr: 'Skyr',
      edamame: 'Edamame',
      lox: 'Lox (Cured Salmon)',
      anchovies: 'Anchovies',
      mussels: 'Mussels',
      chicken_liver: 'Chicken Liver',
      beef_liver: 'Beef Liver',
      couscous: 'Couscous',
      bulgur: 'Bulgur',
      rice_cakes: 'Rice Cakes',
      plantain: 'Plantain',
      chickpeas: 'Chickpeas',
      brown_rice: 'Brown Rice',
      whole_wheat_pasta: 'Whole Wheat Pasta',
      barley: 'Barley',
      rye_bread: 'Rye Bread',
      granola: 'Granola',
      farro: 'Farro',
      sourdough: 'Sourdough Bread',
      pita_bread: 'Pita Bread',
      millet: 'Millet',
      tapioca: 'Tapioca',
      cassava: 'Cassava',
      taro: 'Taro',
      walnuts: 'Walnuts',
      pumpkin_seeds: 'Pumpkin Seeds',
      sunflower_seeds: 'Sunflower Seeds',
      ghee: 'Ghee',
      butter: 'Butter',
      cashews: 'Cashews',
      pistachios: 'Pistachios',
      macadamia: 'Macadamia Nuts',
      brazil_nuts: 'Brazil Nuts',
      pecans: 'Pecans',
      hemp_seeds: 'Hemp Seeds',
      flaxseeds: 'Flaxseeds',
      tahini: 'Tahini',
      sesame_oil: 'Sesame Oil',
      dark_chocolate: 'Dark Chocolate',
      coconut_milk: 'Coconut Milk',
      almond_butter: 'Almond Butter',
      grapes: 'Grapes',
      watermelon: 'Watermelon',
      peach: 'Peach',
      cherry: 'Cherry',
      blueberries: 'Blueberries',
      raspberries: 'Raspberries',
      papaya: 'Papaya',
      pomegranate: 'Pomegranate',
      lemon: 'Lemon',
      lime: 'Lime',
      grapefruit: 'Grapefruit',
      plum: 'Plum',
      fig: 'Fig',
      date: 'Date',
      apricot: 'Apricot',
      coconut: 'Coconut',
      dragonfruit: 'Dragon Fruit',
      passion_fruit: 'Passion Fruit',
      kale: 'Kale',
      asparagus: 'Asparagus',
      cauliflower: 'Cauliflower',
      mushroom: 'Mushrooms',
      eggplant: 'Eggplant',
      celery: 'Celery',
      beet: 'Beet',
      radish: 'Radish',
      artichoke: 'Artichoke',
      peas: 'Peas',
      green_beans: 'Green Beans',
      leek: 'Leek',
      bok_choy: 'Bok Choy',
      brussels_sprouts: 'Brussels Sprouts',
      sweet_corn: 'Sweet Corn',
      pumpkin: 'Pumpkin',
      cabbage: 'Cabbage',
      arugula: 'Arugula',
      sriracha: 'Sriracha',
      balsamic: 'Balsamic Vinegar',
      cinnamon: 'Cinnamon',
      turmeric: 'Turmeric',
      ginger: 'Ginger',
      honey: 'Honey',
      agave: 'Agave',
      maple_syrup: 'Maple Syrup',
      apple_cider_vinegar: 'Apple Cider Vinegar',
      worcestershire: 'Worcestershire Sauce',
      fish_sauce: 'Fish Sauce',
      tamari: 'Tamari',
      miso: 'Miso',
      cumin: 'Cumin',
      paprika: 'Paprika',
      oregano: 'Oregano',
      basil: 'Basil',
      thyme: 'Thyme',
      rosemary: 'Rosemary',
      milk: 'Milk',
      heavy_cream: 'Heavy Cream',
      almond_milk: 'Almond Milk',
      oat_milk: 'Oat Milk',
      soy_milk: 'Soy Milk',
      mozzarella: 'Mozzarella',
      parmesan: 'Parmesan',
      cheddar: 'Cheddar',
      feta: 'Feta Cheese',
      ricotta: 'Ricotta',
      cream_cheese: 'Cream Cheese',
      whipping_cream: 'Whipping Cream',
      kefir: 'Kefir',
      ice_cream: 'Ice Cream',
      water: 'Water',
      coffee: 'Coffee',
      green_tea: 'Green Tea',
      black_tea: 'Black Tea',
      matcha: 'Matcha',
      orange_juice: 'Orange Juice',
      protein_shake: 'Protein Shake',
      smoothie: 'Smoothie',
      coconut_water: 'Coconut Water',
      sports_drink: 'Sports Drink',
      bone_broth: 'Bone Broth',
      kombucha: 'Kombucha',
      dairy: 'Dairy',
      beverages: 'Beverages',
    }
  }
};

// Deep merge with fix priority
function applyFixes(obj, fixes) {
  if (!fixes) return obj;
  const result = { ...obj };
  for (const [key, value] of Object.entries(fixes)) {
    if (typeof value === 'object' && !Array.isArray(value) && typeof result[key] === 'object') {
      result[key] = applyFixes(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Apply fixes to en.json
const enPath = path.join(i18nPath, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fixedEn = applyFixes(enData, enFixes);

// Also add common.slogan if missing
if (!fixedEn.common) fixedEn.common = {};
if (!fixedEn.common.slogan) fixedEn.common.slogan = 'Your best version';

fs.writeFileSync(enPath, JSON.stringify(fixedEn, null, 2));
console.log('Fixed en.json successfully');

// Check the tabs object in other languages to add "social" tab if missing
const langs = ['es', 'fr', 'de', 'it', 'pt', 'ru'];
const tabTranslations = {
  es: 'Social',
  fr: 'Social', 
  de: 'Community',
  it: 'Social',
  pt: 'Social',
  ru: 'Социальные',
};

const sloganTranslations = {
  es: 'Tu mejor versión',
  fr: 'Votre meilleure version',
  de: 'Deine beste Version',
  it: 'La tua migliore versione',
  pt: 'Sua melhor versão',
  ru: 'Ваша лучшая версия',
};

langs.forEach(lang => {
  const langPath = path.join(i18nPath, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(langPath, 'utf8'));

  // Ensure tabs.social exists
  if (!data.tabs) data.tabs = {};
  if (!data.tabs.social) {
    data.tabs.social = tabTranslations[lang] || 'Social';
  }
  
  // Add slogan to common
  if (!data.common) data.common = {};
  if (!data.common.slogan) {
    data.common.slogan = sloganTranslations[lang];
  }

  fs.writeFileSync(langPath, JSON.stringify(data, null, 2));
  console.log(`Fixed ${lang}.json`);
});

console.log('All fixes applied!');
