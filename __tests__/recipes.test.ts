import { getCuratedRecipes, CURATED_RECIPES } from '../services/recipes/curatedRecipes';

describe('Recipes Module & Curated Catalog', () => {
  it('should have a populated curated recipes catalog with valid nutritional data', () => {
    expect(CURATED_RECIPES.length).toBeGreaterThan(5);
    for (const recipe of CURATED_RECIPES) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.calories).toBeGreaterThan(0);
      expect(recipe.protein).toBeGreaterThan(0);
      expect(recipe.prepTime).toBeGreaterThan(0);
      expect(recipe.es.name).toBeTruthy();
      expect(recipe.es.ingredients.length).toBeGreaterThan(0);
      expect(recipe.es.instructions.length).toBeGreaterThan(0);
      expect(recipe.en.name).toBeTruthy();
    }
  });

  it('should return recipes matching default goal', () => {
    const recipes = getCuratedRecipes(undefined, 'gain', 'es');
    expect(recipes.length).toBeGreaterThan(0);
    expect(recipes[0].goal).toBe('gain');
  });

  it('should filter recipes by protein query', () => {
    const proteinRecipes = getCuratedRecipes('proteína', 'maintain', 'es');
    expect(proteinRecipes.length).toBeGreaterThan(0);
    expect(proteinRecipes[0].protein).toBeGreaterThanOrEqual(30);
  });

  it('should filter recipes by ingredient (e.g. avena, pollo, salmon)', () => {
    const oatRecipes = getCuratedRecipes('avena', 'maintain', 'es');
    expect(oatRecipes.length).toBeGreaterThan(0);
    expect(
      oatRecipes.some(r => r.name.toLowerCase().includes('avena') || r.ingredients.some(i => i.toLowerCase().includes('avena')))
    ).toBe(true);

    const salmonRecipes = getCuratedRecipes('salmón', 'maintain', 'es');
    expect(salmonRecipes.length).toBeGreaterThan(0);
    expect(
      salmonRecipes.some(r => r.name.toLowerCase().includes('salmón') || r.ingredients.some(i => i.toLowerCase().includes('salmón')))
    ).toBe(true);
  });

  it('should support English language localization', () => {
    const enRecipes = getCuratedRecipes(undefined, 'lose', 'en');
    expect(enRecipes.length).toBeGreaterThan(0);
    // English name check
    expect(enRecipes.some(r => r.name.includes('Chicken') || r.name.includes('Salad') || r.name.includes('Oatmeal') || r.name.includes('Salmon'))).toBe(true);
  });

  it('should support Portuguese, French, German, Italian and Russian localizations', () => {
    const ptRecipes = getCuratedRecipes(undefined, 'maintain', 'pt');
    expect(ptRecipes.some(r => r.name.includes('Frango') || r.name.includes('Salmão'))).toBe(true);

    const frRecipes = getCuratedRecipes(undefined, 'maintain', 'fr');
    expect(frRecipes.some(r => r.name.includes('Poulet') || r.name.includes('Saumon'))).toBe(true);

    const deRecipes = getCuratedRecipes(undefined, 'maintain', 'de');
    expect(deRecipes.some(r => r.name.includes('Hähnchen') || r.name.includes('Lachsfilet'))).toBe(true);

    const itRecipes = getCuratedRecipes(undefined, 'maintain', 'it');
    expect(itRecipes.some(r => r.name.includes('Pollo') || r.name.includes('Salmone'))).toBe(true);

    const ruRecipes = getCuratedRecipes(undefined, 'maintain', 'ru');
    expect(ruRecipes.some(r => r.name.includes('Куриная') || r.name.includes('лосося'))).toBe(true);
  });
});
