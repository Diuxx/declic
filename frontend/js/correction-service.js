(function registerCorrectionService(root) {
  'use strict';

  const API_BASE_URL = root.DeclicConfig?.apiBaseUrl || '';
  const CORRECTION_ENDPOINT = '/api/v1/correction';

  function toLanguageCode() {
    const lang = String(root.document?.documentElement?.lang || 'fr').toLowerCase();
    return lang.startsWith('en') ? 'en' : 'fr';
  }

  function mapApiResponse(response) {
    if (!response || typeof response !== 'object') {
      throw new TypeError('Réponse API invalide.');
    }

    const correction = typeof response.correction === 'string' ? response.correction : null;
    const changes = Array.isArray(response.changes) ? response.changes : null;

    if (correction === null || changes === null) {
      throw new TypeError('Réponse API incomplète.');
    }

    return {
      correctedText: correction,
      corrections: changes.map(change => ({
        before: String(change.original ?? ''),
        after: String(change.corrected ?? ''),
        explanation: String(change.explanation ?? '')
      }))
    };
  }

  async function readErrorMessage(response) {
    try {
      const payload = await response.json();
      if (payload && typeof payload.message === 'string' && payload.message) {
        return payload.message;
      }
    } catch {
      // Ignore JSON parsing failures and use fallback message below.
    }

    return `Erreur HTTP ${response.status}`;
  }

  /**
   * Appelle l'API backend de correction.
   * @param {string} text Texte original, sans suppression des espaces.
   * @param {{includeExplanations?: boolean}=} options Options d'appel.
   * @returns {Promise<{correctedText: string, corrections: Array<{before: string, after: string, explanation: string}>}>}
   */
  async function correctText(text, options = {}) {
    if (typeof text !== 'string') {
      throw new TypeError('Le texte à corriger doit être une chaîne.');
    }

    const requestPayload = {
      text,
      language: toLanguageCode(),
      includeExplanations: Boolean(options.includeExplanations)
    };

    const response = await fetch(`${API_BASE_URL}${CORRECTION_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const payload = await response.json();
    return mapApiResponse(payload);
  }

  root.Declic = root.Declic || {};
  root.Declic.correctText = correctText;
})(globalThis);
