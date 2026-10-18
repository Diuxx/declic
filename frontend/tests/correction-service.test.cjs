const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const { loadScript } = require('./browser-fixture.cjs');

function createService() {
  const context = vm.createContext({});
  loadScript(context, 'correction-service.js');
  return context.Declic.correctText;
}

test('corrige les fautes prises en charge et conserve les espaces et retours à la ligne', async () => {
  const correctText = createService();
  const response = await correctText('  Bonjours, sa va ?\nJe peut écrire beaucoups. Je suis aller.  ');
  assert.equal(response.correctedText, '  Bonjour, ça va ?\nJe peux écrire beaucoup. Je suis allé.  ');
  assert.equal(response.corrections.length, 5);
  assert.ok(response.corrections.every(detail => detail.explanation.length > 0));
});

test('compte chaque occurrence et ne modifie pas les mots qui contiennent seulement une faute en sous-chaîne', async () => {
  const response = await createService()('bonjours bonjours bonjoursXYZ');
  assert.equal(response.correctedText, 'bonjour bonjour bonjoursXYZ');
  assert.equal(response.corrections.length, 2);
});

test('la règle ne conserve que la majuscule initiale, comme dans la version validée', async () => {
  const response = await createService()('BONJOURS');
  assert.equal(response.correctedText, 'Bonjour');
});

test('renvoie les textes non reconnus sans prétendre les avoir corrigés', async () => {
  const response = await createService()('Une phrase sans faute.');
  assert.equal(response.correctedText, 'Une phrase sans faute.');
  assert.equal(response.corrections.length, 0);
});

test('gère le texte vide et refuse une entrée qui ne soit pas une chaîne', async () => {
  const correctText = createService();
  assert.equal((await correctText('')).correctedText, '');
  await assert.rejects(correctText(null), { name: 'TypeError' });
});
