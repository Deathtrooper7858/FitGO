import { checkContent, sanitizeContent, normalizeText } from '../../utils/contentFilter';

describe('contentFilter', () => {
  describe('Whitelisted words (Scunthorpe problem prevention)', () => {
    const safeWords = [
      'computadora',
      'asumir que todo está bien',
      'haremos un análisis completo',
      'el pasado fin de semana',
      'vamos a discutir el plan',
      'asistiré a la clase de spinning',
      'descarga el documento',
      'peacock',
      'cockpit',
      'assets and liabilities',
      'please put it here',
    ];

    safeWords.forEach(phrase => {
      it(`does NOT flag legitimate sentence: "${phrase}"`, () => {
        const result = checkContent(phrase);
        expect(result.isClean).toBe(true);
        expect(result.flagged).toBe(false);
        expect(result.flaggedWords).toHaveLength(0);
      });
    });
  });

  describe('Profanity and Slur Detection', () => {
    it('detects and flags Spanish profanities', () => {
      const res = checkContent('eres un pendejo');
      expect(res.flagged).toBe(true);
      expect(res.flaggedWords.length).toBeGreaterThan(0);
    });

    it('detects and flags English profanities', () => {
      const res = checkContent('what the fuck is this');
      expect(res.flagged).toBe(true);
      expect(res.flaggedWords.length).toBeGreaterThan(0);
    });

    it('detects repeated characters like "puuuuutaaa"', () => {
      const res = checkContent('eres una puuuuutaaa');
      expect(res.flagged).toBe(true);
    });

    it('detects leetspeak substitutions like "p3nd3jo"', () => {
      const res = checkContent('hola p3nd3jo');
      expect(res.flagged).toBe(true);
    });

    it('detects sensitive phrases like "kill yourself"', () => {
      const res = checkContent('go kill yourself now');
      expect(res.flagged).toBe(true);
      expect(res.category).toBe('sensitive_topic');
    });
  });

  describe('Sanitization / Masking', () => {
    it('masks offensive words with asterisks while keeping non-offensive words intact', () => {
      const clean = sanitizeContent('hola pendejo amigo');
      expect(clean).toContain('hola');
      expect(clean).toContain('amigo');
      expect(clean).not.toContain('pendejo');
      expect(clean).toMatch(/\*{3,}/);
    });

    it('leaves whitelisted clean sentences untouched', () => {
      const sentence = 'Estoy en mi computadora analizando el pasado.';
      expect(sanitizeContent(sentence)).toBe(sentence);
    });
  });
});
