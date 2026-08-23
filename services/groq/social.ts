import { getLang, fetchGroq, FAST_MODEL, CHAT_MODEL } from './core';

// ─── Generate Shopping List ───────────────────────────────────────────────────
export async function generateShoppingListJSON(mealPlans: Record<string, any[]>, language: string = 'en'): Promise<{category: string; items: {name: string; quantity: string; price: number}[]}[]> {
  const targetLang = getLang(language);
  
  const prompt = `Based on the following weekly meal plan, create a detailed and categorized shopping list of all ingredients needed for the ENTIRE week.
Return ONLY a valid JSON object matching this EXACT structure (no markdown, no explanation):
{
  "categories": [
    {
      "category": "Category name in ${targetLang}",
      "items": [
        { "name": "Ingredient name in ${targetLang}", "quantity": "Estimated total quantity for the week (e.g. '500g', '6 units', '1 liter')", "price": 2.50 }
      ]
    }
  ]
}

Rules:
- Consolidate all occurrences of the same ingredient across all 7 days into ONE entry with the total quantity needed.
- The "price" field must be a realistic approximate price in USD (e.g. 1.50 for a banana bunch, 5.00 for chicken breast 500g). It must be a number, not a string.
- Translate ALL text (category names and ingredient names) to ${targetLang}.
- Group items into logical categories: Frutas, Verduras, Carnes y Proteínas, Lácteos y Huevos, Cereales y Granos, Condimentos y Otros.
- NEVER include duplicates.

Meal Plan:
${JSON.stringify(mealPlans)}`;

  try {
    const data = await fetchGroq({
      model: FAST_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    let text = (data.choices[0]?.message?.content ?? '').trim();
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      text = text.slice(startIndex, endIndex + 1);
    }
    
    const parsed = JSON.parse(text);
    return parsed.categories || [];
  } catch (error) {
    console.error('Error generating JSON shopping list:', error);
    throw error;
  }
}

export async function generateShoppingList(mealPlans: Record<string, any[]>, language: string = 'en'): Promise<string> {
  const targetLang = getLang(language);
  
  const prompt = `Based on the following weekly meal plan, create a comprehensive and beautiful shopping list.
Group the items by category (e.g., Produce, Meat, Dairy, Pantry).
For each item, estimate the total quantity needed for the entire week based on the meals provided.
CRITICAL: Include an estimated total price for the shopping list based on average prices in USD. Always display the final estimated price in USD (e.g. "$45.00 USD").
Format the output as a clean, visually appealing, modern HTML document (NO markdown blocks, just raw HTML).
Use beautiful inline CSS with colors like #7C5CFC (primary), clean fonts (sans-serif), and neat tables or lists.
Make sure all text, categories, and items are translated to ${targetLang}.

Meal Plan Data:
${JSON.stringify(mealPlans)}

Return ONLY the raw HTML string, nothing else. No markdown formatting.`;

  const data = await fetchGroq({
    model: FAST_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.5,
  });

  let text = (data.choices[0]?.message?.content ?? '').trim();
  text = text.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return text;
}

// ─── Generate Social Challenge ────────────────────────────────────────────────
export async function generateSocialChallenge(language: string = 'en'): Promise<string> {
  const targetLang = getLang(language);
  
  const prompt = `You are an AI fitness coach. Create a short, fun, 1-sentence fitness challenge that two friends can compete in.
Example: "Walk 10,000 steps for 3 consecutive days."
IMPORTANT: Return ONLY the sentence. No extra text, no markdown. It MUST be translated to ${targetLang}.`;

  const data = await fetchGroq({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.8,
  });

  return (data.choices[0]?.message?.content ?? 'Walk 10,000 steps for 3 consecutive days.').trim();
}
