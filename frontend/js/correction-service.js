(function registerCorrectionService(root) {
  'use strict';

  // Règles de démonstration uniquement : aucun modèle d'IA n'est appelé.
  const CORRECTION_RULES = Object.freeze([
    {
      pattern: /\bsa va\b/gi,
      replacement: 'ça va',
      explanation: '« Ça » est un pronom démonstratif.'
    },
    {
      pattern: /\bbonjours\b/gi,
      replacement: 'bonjour',
      explanation: 'La salutation « bonjour » ne prend pas de s.'
    },
    {
      pattern: /\bje suis aller\b/gi,
      replacement: 'je suis allé',
      explanation: 'Après « suis », on emploie ici le participe passé (accord masculin dans cette démonstration).'
    },
    {
      pattern: /\bje peut\b/gi,
      replacement: 'je peux',
      explanation: 'Avec « je », le verbe pouvoir se conjugue « peux ».'
    },
    {
      pattern: /\bbeaucoups\b/gi,
      replacement: 'beaucoup',
      explanation: '« Beaucoup » est invariable.'
    }
  ]);

  function preserveInitialCapital(original, replacement) {
    if (original[0] === original[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }

  function applyCorrectionRule(text, rule) {
    const corrections = [];
    const correctedText = text.replace(rule.pattern, before => {
      const after = preserveInitialCapital(before, rule.replacement);
      corrections.push({ before, after, explanation: rule.explanation });
      return after;
    });
    return { correctedText, corrections };
  }

  /**
   * Point de raccordement du futur backend.
   * @param {string} text Texte original, sans suppression des espaces.
   * @returns {Promise<{correctedText: string, corrections: Array<{before: string, after: string, explanation: string}>}>}
   * Remplacer cette fonction pour appeler l'API, sans mettre de secret côté navigateur.
   */
  async function correctText(text) {
    if (typeof text !== 'string') {
      throw new TypeError('Le texte à corriger doit être une chaîne.');
    }

    let correctedText = text;
    const corrections = [];
    for (const rule of CORRECTION_RULES) {
      const result = applyCorrectionRule(correctedText, rule);
      correctedText = result.correctedText;
      corrections.push(...result.corrections);
    }
    return { correctedText, corrections };
  }

  root.Declic = root.Declic || {};
  root.Declic.correctText = correctText;
})(globalThis);
