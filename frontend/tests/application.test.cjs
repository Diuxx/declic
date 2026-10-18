const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { PROJECT_ROOT, createBrowserFixture } = require('./browser-fixture.cjs');

function enterText(elements, text) {
  elements.get('textInput').value = text;
  elements.get('textInput').dispatch('input');
}

function submit(elements) {
  return elements.get('correctionForm').dispatch('submit');
}

test('bascule entre les présentations en conservant le bloc, la saisie, le résultat et la checkbox', async () => {
  const { elements, document, classes } = createBrowserFixture();
  const workspace = elements.get('workspace');
  enterText(elements, 'Bonjours, je peut écrire.');
  elements.get('showDetails').checked = true;
  await submit(elements);

  elements.get('modeToggle').dispatch('click');
  assert.equal(workspace.parent.id, 'articleWorkspaceSlot');
  assert.equal(elements.get('standardHeader').hidden, true);
  assert.equal(elements.get('articleView').hidden, false);
  assert.equal(document.title, 'Carnet — Les villes à hauteur de marche');
  assert.equal(elements.get('status').textContent, 'Note mise à jour.');
  assert.ok(classes.has('camouflage'));
  assert.equal(elements.get('textInput').style.height, '120px');

  elements.get('modeToggle').dispatch('click');
  assert.equal(workspace.parent.id, 'standardWorkspaceSlot');
  assert.equal(elements.get('result').hidden, false);
  assert.equal(elements.get('correctedText').textContent, 'Bonjour, je peux écrire.');
  assert.equal(elements.get('textInput').value, 'Bonjours, je peut écrire.');
  assert.equal(elements.get('showDetails').checked, true);
  assert.equal(elements.get('details').hidden, false);
  assert.equal(elements.get('textInput').style.height, '');
  assert.equal(elements.get('modeToggle').attributes['aria-pressed'], 'false');
});

test('affiche et masque les détails, puis invalide le résultat lorsque la saisie change', async () => {
  const { elements } = createBrowserFixture();
  enterText(elements, 'bonjours');
  await submit(elements);
  assert.equal(elements.get('details').hidden, true);
  elements.get('showDetails').checked = true;
  elements.get('showDetails').dispatch('change');
  assert.equal(elements.get('details').hidden, false);
  elements.get('showDetails').checked = false;
  elements.get('showDetails').dispatch('change');
  assert.equal(elements.get('details').hidden, true);
  enterText(elements, 'autre texte');
  assert.equal(elements.get('result').hidden, true);
  assert.equal(elements.get('status').textContent, '');
});

test('compte un emoji comme un caractère et ajuste la hauteur des notes', () => {
  const { elements } = createBrowserFixture();
  elements.get('modeToggle').dispatch('click');
  elements.get('textInput').scrollHeight = 320;
  enterText(elements, '🙂');
  assert.equal(elements.get('counter').textContent, '1 caractère');
  assert.equal(elements.get('textInput').style.height, '320px');
});

test('refuse un texte composé uniquement d’espaces sans appeler le service', async () => {
  let calls = 0;
  const { elements } = createBrowserFixture({ correctText: async () => { calls++; } });
  enterText(elements, ' \n ');
  await submit(elements);
  assert.equal(calls, 0);
  assert.equal(elements.get('textInput').focused, true);
  assert.equal(elements.get('correctButton').disabled, false);
});

test('bloque les doubles soumissions et conserve les libellés si le mode change pendant la requête', async () => {
  let resolveRequest;
  let calls = 0;
  const { elements } = createBrowserFixture({ correctText: () => {
    calls++;
    return new Promise(resolve => { resolveRequest = resolve; });
  } });
  enterText(elements, 'bonjours');
  const pending = submit(elements);
  assert.equal(elements.get('correctButton').disabled, true);
  assert.equal(elements.get('textInput').readOnly, true);
  await submit(elements);
  assert.equal(calls, 1);
  elements.get('modeToggle').dispatch('click');
  assert.equal(elements.get('correctButton').textContent, 'Mise à jour…');
  resolveRequest({ correctedText: 'bonjour', corrections: [] });
  await pending;
  assert.equal(elements.get('correctButton').textContent, 'Mettre à jour ↗');
  assert.equal(elements.get('correctButton').disabled, false);
  assert.equal(elements.get('textInput').readOnly, false);
});

for (const scenario of ['service indisponible', 'réponse invalide']) {
  test(`affiche un échec et réactive la saisie : ${scenario}`, async () => {
    const correctText = scenario === 'service indisponible'
      ? async () => { throw new Error('Réponse contenant des informations privées'); }
      : async () => ({ correctedText: 'bonjour', corrections: [{ before: 'bonjours' }] });
    const { elements, errors } = createBrowserFixture({ correctText });
    enterText(elements, 'texte privé');
    await submit(elements);
    assert.equal(elements.get('result').hidden, true);
    assert.match(elements.get('status').textContent, /échoué/);
    assert.equal(elements.get('correctButton').disabled, false);
    assert.equal(elements.get('textInput').readOnly, false);
    assert.equal(errors.length, 1);
    assert.doesNotMatch(JSON.stringify(errors), /informations privées|texte privé/);
  });
}

test('affiche le contenu comme du texte et gère le résultat sans correction', async () => {
  const { elements } = createBrowserFixture();
  enterText(elements, '<img src=x onerror=alert(1)>');
  await submit(elements);
  assert.equal(elements.get('correctedText').textContent, '<img src=x onerror=alert(1)>');
  assert.equal(elements.get('correctedText').children.length, 0);
  assert.equal(elements.get('correctionsList').children[0].textContent, 'Aucune modification proposée.');
});

test('copie le résultat et propose une copie manuelle lorsque le presse-papiers est indisponible', async () => {
  const success = createBrowserFixture();
  enterText(success.elements, 'bonjours');
  await submit(success.elements);
  await success.elements.get('copyButton').dispatch('click');
  assert.deepEqual(success.copiedTexts, ['bonjour']);
  assert.equal(success.elements.get('status').textContent, 'Texte corrigé copié.');

  const failure = createBrowserFixture({ clipboard: null });
  enterText(failure.elements, 'bonjours');
  await submit(failure.elements);
  await failure.elements.get('copyButton').dispatch('click');
  assert.match(failure.elements.get('status').textContent, /Sélectionnez/);
});

test('la page référence des fichiers locaux existants et charge les scripts dans l’ordre prévu', () => {
  const html = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /<style>|<script>/);
  const scripts = [...html.matchAll(/<script src="([^"]+)" defer>/g)].map(match => match[1]);
  assert.deepEqual(scripts, ['js/correction-service.js', 'js/editor-view.js', 'js/app.js']);
  const resources = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  for (const resource of resources) assert.ok(fs.existsSync(path.join(PROJECT_ROOT, resource)));
});
