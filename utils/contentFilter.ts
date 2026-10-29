/**
 * FitGO Content & Profanity Filter
 * 
 * Objective, precise, and multi-language content filter for Chat and Community.
 * Protects users against profanity, hate speech, severe insults, and sensitive topics
 * while strictly avoiding false positives (The Scunthorpe Problem).
 */

export type FilterCategory = 'profanity' | 'hate_speech' | 'harassment' | 'sensitive_topic';

export interface ContentFilterResult {
  isClean: boolean;
  flagged: boolean;
  flaggedWords: string[];
  category?: FilterCategory;
  cleanText: string;
}

// ── Exact word lists (normalized without accents) ────────────────────────────

// Highly offensive Spanish words/slurs (standalone)
const ES_PROFANITIES = [
  'puta', 'puto', 'putas', 'putos', 'puton', 'putona', 'putita', 'putito',
  'mierda', 'mierdas', 'mierdon',
  'pendejo', 'pendeja', 'pendejos', 'pendejas', 'pendejada', 'pendejadas',
  'cabron', 'cabrona', 'cabrones', 'cabronas', 'cabronada',
  'cojones', 'cojon', 'cojonudo', 'cojonuda',
  'verga', 'vergas', 'vergazo', 'vergazos',
  'chingar', 'chingada', 'chingado', 'chingados', 'chingon', 'chingona', 'chingadera',
  'pinche', 'pinches',
  'culiao', 'culiao', 'culiaos', 'culiada', 'culiados',
  'culero', 'culera', 'culeros', 'culeras',
  'hijo de puta', 'hija de puta', 'hijos de puta', 'hdp',
  'gilipollas', 'capullo', 'subnormal', 'maricon', 'marica', 'maricas', 'maricones',
  'malparido', 'malparida', 'malparidos', 'malparidas',
  'gonorrea', 'carechimba', 'chimba',
  'mamahuevo', 'mamaguevo', 'singao', 'singada',
  'pelotudo', 'pelotuda', 'pelotudos', 'pelotudas',
  'boludo', 'boluda', 'boludos', 'boludas',
  'concha de tu madre', 'conchetumadre', 'conchatumadre', 'ctm',
  'imbecil', 'estupido', 'estupida', 'idiota', 'tarado', 'tarada',
  'zorra', 'zorras',
];

// English profanities & slurs (standalone)
const EN_PROFANITIES = [
  'fuck', 'fucker', 'fucking', 'fucked', 'fuckers', 'motherfucker', 'motherfucking',
  'shit', 'shitty', 'bullshit', 'dipshit',
  'bitch', 'bitches', 'bitching',
  'asshole', 'assholes', 'jackass', 'dumbass',
  'cunt', 'cunts',
  'dick', 'dicks', 'dickhead',
  'bastard', 'bastards',
  'whore', 'whores', 'slut', 'sluts',
  'nigger', 'nigga', 'niggers', 'niggas',
  'faggot', 'fag', 'faggots',
  'retard', 'retarded',
];

// Portuguese profanities
const PT_PROFANITIES = [
  'porra', 'caralho', 'foda', 'foder', 'fodasse', 'foda-se',
  'puta', 'puto', 'filho da puta', 'filha da puta',
  'merda', 'bosta', 'arrombado', 'arrombada',
  'otario', 'otaria', 'babaca', 'cuzao',
];

// Sensitive phrases / self-harm / illicit solicitation
const SENSITIVE_PHRASES = [
  'suicidate', 'matate', 'cortate las venas',
  'kill yourself', 'kys',
  'vendo droga', 'vendo esteroides', 'vendo roids',
  'buy steroids', 'sell cocaine', 'sell weed',
];

// Safe words whitelist to protect against the Scunthorpe problem
const SAFE_WHITELIST = new Set([
  'computadora', 'computador', 'asumir', 'asumo', 'asumes', 'asume', 'asumido', 'asuncion',
  'analisis', 'analitica', 'analista', 'analizar', 'anales', 'clasista', 'clase', 'clases',
  'discutir', 'disputa', 'disputar', 'pasado', 'pasada', 'pasados', 'pasadas',
  'conducir', 'conducta', 'bitacora', 'documento', 'documentos',
  'sotano', 'botas', 'boto', 'rebotar', 'chiste', 'chistoso',
  'curva', 'curvas', 'circulo', 'peso', 'pesos', 'pecho', 'pechos',
  'put', 'puts', 'push', 'pull', 'assets', 'asset', 'grass', 'glass',
  'cockpit', 'peacock', 'canal', 'asociacion', 'asociar', 'asociados',
  'constatar', 'costa', 'cuestion', 'cuestiones', 'proceso', 'procesos',
]);

// Map leetspeak characters to standard letters
const LEET_MAP: Record<string, string> = {
  '@': 'a', '4': 'a',
  '1': 'i', '!': 'i', '|': 'i',
  '0': 'o',
  '3': 'e',
  '5': 's', '$': 's',
  '7': 't', '+': 't',
  '8': 'b',
  '9': 'g',
  'v': 'u',
};

/**
 * Normalizes text for inspection:
 * - Lowercases
 * - Removes accents / diacritics
 * - Normalizes common leetspeak substitutions
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  // 1. Convert to lowercase
  let str = text.toLowerCase();

  // 2. Remove accents/diacritics
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 3. Replace common leetspeak characters
  let leetClean = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    leetClean += LEET_MAP[ch] || ch;
  }

  return leetClean;
}

/**
 * Checks if a word is on the safe whitelist
 */
function isSafeWord(word: string): boolean {
  return SAFE_WHITELIST.has(word);
}

/**
 * Collapses repeating letters to single or double letters
 * e.g., "puuuuutaaaa" -> "puta", "fuuuuck" -> "fuck", "asssshole" -> "asshole"
 */
function collapseRepeats(str: string): { single: string; double: string } {
  return {
    single: str.replace(/(.)\1+/g, '$1'),
    double: str.replace(/(.)\1{2,}/g, '$1$1'),
  };
}

// Build consolidated compiled regexes with word boundaries
const ALL_WORDS = [
  ...new Set([...ES_PROFANITIES, ...EN_PROFANITIES, ...PT_PROFANITIES])
];

// Single regex to match sensitive exact phrases
const SENSITIVE_REGEXES = SENSITIVE_PHRASES.map(phrase => {
  const clean = phrase.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return new RegExp(`\\b${clean.replace(/\s+/g, '\\s+')}\\b`, 'i');
});

/**
 * Checks whether the given text contains profanity, hate speech, or sensitive phrases.
 */
export function checkContent(text: string): ContentFilterResult {
  if (!text || !text.trim()) {
    return {
      isClean: true,
      flagged: false,
      flaggedWords: [],
      cleanText: text || '',
    };
  }

  const normalized = normalizeText(text);
  const collapsed = collapseRepeats(normalized);
  const flaggedWords: string[] = [];
  let category: FilterCategory | undefined;

  // 1. Check sensitive multi-word phrases first
  for (const regex of SENSITIVE_REGEXES) {
    if (regex.test(normalized) || regex.test(collapsed.single) || regex.test(collapsed.double)) {
      flaggedWords.push('sensitive_phrase');
      category = 'sensitive_topic';
    }
  }

  // 2. Tokenize normalized string into individual words/tokens
  const rawWords = text.split(/[\s,.;:!?¿¡"()\[\]{}<>/\\|_\-+*~^`]+/);

  for (const raw of rawWords) {
    if (!raw) continue;
    const norm = normalizeText(raw);
    const coll = collapseRepeats(norm);

    if (isSafeWord(norm) || isSafeWord(coll.single) || isSafeWord(coll.double)) {
      continue;
    }

    // Exact check in profanity list
    for (const bad of ALL_WORDS) {
      if (norm === bad || coll.single === bad || coll.double === bad) {
        flaggedWords.push(raw);
        if (!category) {
          category = (bad.includes('nigg') || bad.includes('fag') || bad.includes('maric') || bad.includes('subnormal'))
            ? 'hate_speech'
            : 'profanity';
        }
      }
    }
  }

  const flagged = flaggedWords.length > 0;

  return {
    isClean: !flagged,
    flagged,
    flaggedWords,
    category,
    cleanText: flagged ? sanitizeContent(text) : text,
  };
}

/**
 * Sanitizes the text by replacing identified profanities with asterisks (***),
 * preserving original casing, surrounding punctuation, and structure.
 */
export function sanitizeContent(text: string): string {
  if (!text) return '';

  let result = text;

  // Mask sensitive phrases
  for (const phrase of SENSITIVE_PHRASES) {
    const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${esc}\\b`, 'gi');
    result = result.replace(regex, '***');
  }

  // Mask individual bad words
  const words = text.split(/([\s,.;:!?¿¡"()\[\]{}<>/\\|_\-+*~^`]+)/);
  const processed = words.map(chunk => {
    if (!chunk || !chunk.trim()) return chunk;
    const norm = normalizeText(chunk);
    const coll = collapseRepeats(norm);

    if (isSafeWord(norm) || isSafeWord(coll.single) || isSafeWord(coll.double)) {
      return chunk;
    }

    for (const bad of ALL_WORDS) {
      if (norm === bad || coll.single === bad || coll.double === bad) {
        // Replace with asterisks of the same length (or at least 3)
        return '*'.repeat(Math.max(3, chunk.length));
      }
    }

    return chunk;
  });

  return processed.join('');
}
