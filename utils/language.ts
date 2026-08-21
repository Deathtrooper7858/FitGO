/**
 * Language detection and tagging utility for social posts.
 */

// Simple lists of common stop words for classification
const SPANISH_STOPWORDS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'con', 'para', 'por', 'que', 'en', 'es', 'del', 'al', 'mi', 'su', 'esta', 'este', 'como', 'yo', 'no', 'se', 'me', 'si', 'pero']);
const ENGLISH_STOPWORDS = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i', 'be', 'at', 'this', 'have', 'from']);
const PORTUGUESE_STOPWORDS = new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'com', 'para', 'por', 'que', 'em', 'do', 'da', 'no', 'na', 'como', 'mais', 'mas', 'seu', 'sua', 'não', 'nos', 'ao']);
const FRENCH_STOPWORDS = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'en', 'que', 'qui', 'est', 'il', 'elle', 'je', 'nous', 'vous', 'ils', 'au', 'sur', 'avec', 'pour', 'pas', 'ce', 'se']);
const GERMAN_STOPWORDS = new Set(['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'und', 'ist', 'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mit', 'von', 'zu', 'für', 'auf', 'nicht', 'an', 'als']);
const ITALIAN_STOPWORDS = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'e', 'che', 'è', 'di', 'del', 'della', 'in', 'con', 'su', 'per', 'si', 'non', 'mi', 'ci', 'ho', 'hai', 'ha']);
const RUSSIAN_STOPWORDS = new Set(['и', 'в', 'не', 'на', 'я', 'с', 'что', 'как', 'это', 'но', 'по', 'за', 'от', 'из', 'о', 'или', 'при', 'же', 'уже', 'ещё', 'для', 'все', 'его', 'её']);

export type PostLanguage = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'other';

/**
 * Detects the language of a text based on frequency of stop words.
 */
export function detectLanguage(text: string): PostLanguage {
  if (!text || text.trim().length === 0) return 'es'; // default to Spanish

  const words = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^\&\*;:{}=\-_`~()?\"']/g, '')
    .split(/\s+/);

  let esCount = 0;
  let enCount = 0;
  let ptCount = 0;
  let frCount = 0;
  let deCount = 0;
  let itCount = 0;
  let ruCount = 0;

  for (const word of words) {
    if (SPANISH_STOPWORDS.has(word)) esCount++;
    if (ENGLISH_STOPWORDS.has(word)) enCount++;
    if (PORTUGUESE_STOPWORDS.has(word)) ptCount++;
    if (FRENCH_STOPWORDS.has(word)) frCount++;
    if (GERMAN_STOPWORDS.has(word)) deCount++;
    if (ITALIAN_STOPWORDS.has(word)) itCount++;
    if (RUSSIAN_STOPWORDS.has(word)) ruCount++;
  }

  const scores: Record<PostLanguage, number> = { es: esCount, en: enCount, pt: ptCount, fr: frCount, de: deCount, it: itCount, ru: ruCount, other: 0 };
  const max = Math.max(...Object.values(scores));
  if (max === 0) return 'es';
  const winner = (Object.keys(scores) as PostLanguage[]).find(k => scores[k] === max);
  return winner || 'es';
}

/**
 * Extracts explicit language tag and returns cleaned content and language.
 */
export function parsePostContent(content: string): { cleanContent: string; language: PostLanguage } {
  if (!content) return { cleanContent: '', language: 'es' };

  const match = content.match(/\[lang:([a-z]{2,5})\]$/);
  if (match) {
    const lang = match[1] as PostLanguage;
    const cleanContent = content.replace(/\[lang:[a-z]{2,5}\]$/, '').trim();
    return { cleanContent, language: lang };
  }

  // Fallback to auto-detection
  return { cleanContent: content, language: detectLanguage(content) };
}

/**
 * Formats post content with an explicit language tag.
 */
export function formatPostContent(content: string, lang?: PostLanguage): string {
  const actualLang = lang || detectLanguage(content);
  return `${content.trim()} [lang:${actualLang}]`;
}
