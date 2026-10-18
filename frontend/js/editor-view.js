(function registerEditorView(root) {
  'use strict';

  const MIN_ARTICLE_INPUT_HEIGHT = 100;
  const PRESENTATIONS = {
    standard: {
      title: 'Déclic — Correction',
      toggle: 'Mode discret',
      inputLabel: 'Texte à corriger',
      placeholder: 'Votre texte commence ici…',
      detailsLabel: 'Afficher les informations corrigées',
      resultTitle: 'Texte corrigé',
      detailsTitle: 'Détail des corrections',
      action: 'Correction ↗',
      busyAction: 'Correction…'
    },
    camouflage: {
      title: 'Carnet — Les villes à hauteur de marche',
      toggle: 'Vue standard',
      inputLabel: 'Notes de lecture',
      placeholder: 'Une idée, une réflexion à retenir…',
      detailsLabel: 'Voir les modifications',
      resultTitle: 'Votre note',
      detailsTitle: 'Modifications',
      action: 'Mettre à jour ↗',
      busyAction: 'Mise à jour…'
    }
  };

  const STATUS_MESSAGES = {
    standard: {
      empty: 'Saisissez un texte à corriger.',
      loading: 'Correction en cours…',
      success: 'Correction terminée.',
      error: 'La correction a échoué. Réessayez dans un instant.',
      copied: 'Texte corrigé copié.',
      copyError: 'Sélectionnez le texte corrigé pour le copier.'
    },
    camouflage: {
      empty: 'Écrivez une note avant de la mettre à jour.',
      loading: 'Mise à jour en cours…',
      success: 'Note mise à jour.',
      error: 'La mise à jour a échoué. Réessayez dans un instant.',
      copied: 'Note copiée.',
      copyError: 'Sélectionnez votre note pour la copier.'
    }
  };

  function collectElements(document) {
    const ids = [
      'correctionForm', 'textInput', 'showDetails', 'correctButton', 'status',
      'result', 'details', 'correctedText', 'correctionsList', 'modeToggle',
      'workspace', 'standardHeader', 'articleView', 'demoHint',
      'articleWorkspaceSlot', 'standardWorkspaceSlot', 'detailsLabel',
      'resultTitle', 'detailsTitle', 'counter', 'copyButton'
    ];
    const elements = {};
    for (const id of ids) {
      const element = document.getElementById(id);
      if (!element) throw new Error(`Élément de l'interface manquant : ${id}`);
      elements[id] = element;
    }
    return elements;
  }

  /** Gère uniquement l'affichage et les événements DOM, sans règle de correction. */
  function createEditorView({ document, window }) {
    const elements = collectElements(document);
    const state = { presentation: 'standard', busy: false, statusKey: null };

    function isCamouflaged() {
      return state.presentation === 'camouflage';
    }

    function refreshStatus() {
      elements.status.textContent = state.statusKey
        ? STATUS_MESSAGES[state.presentation][state.statusKey] : '';
    }

    function showStatus(key) {
      state.statusKey = key;
      refreshStatus();
    }

    function refreshActionLabel() {
      const labels = PRESENTATIONS[state.presentation];
      elements.correctButton.textContent = state.busy ? labels.busyAction : labels.action;
    }

    function setBusy(busy) {
      state.busy = busy;
      elements.correctButton.disabled = busy;
      elements.textInput.readOnly = busy;
      refreshActionLabel();
    }

    function resizeArticleInput() {
      if (!isCamouflaged()) {
        elements.textInput.style.height = '';
        return;
      }
      elements.textInput.style.height = 'auto';
      const height = Math.max(MIN_ARTICLE_INPUT_HEIGHT, elements.textInput.scrollHeight);
      elements.textInput.style.height = `${height}px`;
    }

    function moveWorkspace() {
      const slot = isCamouflaged()
        ? elements.articleWorkspaceSlot : elements.standardWorkspaceSlot;
      // Les mêmes éléments sont déplacés : texte, résultat et écouteurs sont conservés.
      slot.append(elements.workspace);
      resizeArticleInput();
    }

    function refreshPresentationVisibility() {
      const camouflaged = isCamouflaged();
      document.body.classList.toggle('camouflage', camouflaged);
      elements.standardHeader.hidden = camouflaged;
      elements.articleView.hidden = !camouflaged;
      elements.demoHint.hidden = camouflaged;
      elements.modeToggle.setAttribute('aria-pressed', String(camouflaged));
    }

    function refreshPresentationLabels() {
      const labels = PRESENTATIONS[state.presentation];
      document.title = labels.title;
      elements.modeToggle.textContent = labels.toggle;
      elements.textInput.setAttribute('aria-label', labels.inputLabel);
      elements.textInput.placeholder = labels.placeholder;
      elements.detailsLabel.textContent = labels.detailsLabel;
      elements.resultTitle.textContent = labels.resultTitle;
      elements.detailsTitle.textContent = labels.detailsTitle;
    }

    function togglePresentation() {
      state.presentation = isCamouflaged() ? 'standard' : 'camouflage';
      refreshPresentationVisibility();
      moveWorkspace();
      refreshPresentationLabels();
      refreshActionLabel();
      refreshStatus();
      window.scrollTo(0, 0);
    }

    function updateCharacterCount() {
      const count = Array.from(elements.textInput.value).length;
      elements.counter.textContent = `${count} caractère${count > 1 ? 's' : ''}`;
    }

    function hideResult() {
      elements.result.hidden = true;
    }

    function refreshEditor() {
      resizeArticleInput();
      updateCharacterCount();
      hideResult();
      showStatus(null);
    }

    function updateDetailsVisibility() {
      elements.details.hidden = !elements.showDetails.checked;
    }

    function appendCorrectionDetail(correction) {
      const item = document.createElement('li');
      // textContent traite le texte de l'utilisateur comme du texte, jamais comme du HTML.
      item.textContent = `${correction.before} → ${correction.after} : ${correction.explanation}`;
      elements.correctionsList.append(item);
    }

    function renderCorrectionDetails(corrections) {
      elements.correctionsList.replaceChildren();
      if (corrections.length === 0) {
        const item = document.createElement('li');
        item.textContent = 'Aucune modification proposée.';
        elements.correctionsList.append(item);
        return;
      }
      corrections.forEach(appendCorrectionDetail);
    }

    function renderCorrection(response) {
      elements.correctedText.textContent = response.correctedText;
      renderCorrectionDetails(response.corrections);
      elements.result.hidden = false;
      updateDetailsVisibility();
    }

    function bindEvents({ onSubmit, onCopy }) {
      elements.correctionForm.addEventListener('submit', onSubmit);
      elements.copyButton.addEventListener('click', onCopy);
      elements.modeToggle.addEventListener('click', togglePresentation);
      elements.textInput.addEventListener('input', refreshEditor);
      elements.showDetails.addEventListener('change', updateDetailsVisibility);
      window.addEventListener('resize', resizeArticleInput);
    }

    return {
      bindEvents,
      readText: () => elements.textInput.value,
      readCorrectedText: () => elements.correctedText.textContent,
      focusInput: () => elements.textInput.focus(),
      hideResult,
      setBusy,
      showStatus,
      renderCorrection
    };
  }

  root.Declic = root.Declic || {};
  root.Declic.createEditorView = createEditorView;
})(globalThis);
