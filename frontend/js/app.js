(function startCorrectionApplication(root) {
  'use strict';

  const view = root.Declic.createEditorView({ document: root.document, window: root });
  const correctText = root.Declic.correctText;
  let correctionInProgress = false;

  function isValidCorrectionDetail(detail) {
    return detail !== null && typeof detail === 'object'
      && typeof detail.before === 'string'
      && typeof detail.after === 'string'
      && typeof detail.explanation === 'string';
  }

  // Ce contrat restera la frontière de validation lors du raccordement au backend.
  function validateCorrectionResponse(response) {
    const valid = response !== null && typeof response === 'object'
      && typeof response.correctedText === 'string'
      && Array.isArray(response.corrections)
      && response.corrections.every(isValidCorrectionDetail);
    if (!valid) throw new TypeError('Réponse de correction invalide.');
  }

  function beginCorrection() {
    correctionInProgress = true;
    view.setBusy(true);
    view.hideResult();
    view.showStatus('loading');
  }

  function finishCorrection() {
    correctionInProgress = false;
    view.setBusy(false);
  }

  function reportCorrectionFailure(error) {
    view.showStatus('error');
    // Le diagnostic n'inclut ni texte utilisateur ni contenu éventuel de la réponse.
    console.error('Échec de la correction.', {
      errorType: error instanceof Error ? error.name : typeof error
    });
  }

  async function submitCorrection(event) {
    event.preventDefault();
    if (correctionInProgress) return;

    const text = view.readText();
    if (!text.trim()) {
      view.showStatus('empty');
      view.focusInput();
      return;
    }

    beginCorrection();
    try {
      const response = await correctText(text);
      validateCorrectionResponse(response);
      view.renderCorrection(response);
      view.showStatus('success');
    } catch (error) {
      reportCorrectionFailure(error);
    } finally {
      finishCorrection();
    }
  }

  async function copyCorrectedText() {
    try {
      if (!root.navigator.clipboard?.writeText) {
        throw new Error('Presse-papiers indisponible.');
      }
      await root.navigator.clipboard.writeText(view.readCorrectedText());
      view.showStatus('copied');
    } catch {
      // La copie manuelle reste possible, y compris quand le navigateur refuse l'accès.
      view.showStatus('copyError');
    }
  }

  view.bindEvents({ onSubmit: submitCorrection, onCopy: copyCorrectedText });
})(globalThis);
