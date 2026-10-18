const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PROJECT_ROOT = path.join(__dirname, '..');

// DOM minimal : vérifie les comportements, sans prétendre simuler le rendu CSS.
function createElement(id) {
  return {
    id,
    value: '',
    textContent: '',
    checked: false,
    disabled: false,
    hidden: ['articleView', 'result', 'details'].includes(id),
    readOnly: false,
    style: {},
    scrollHeight: 120,
    children: [],
    attributes: {},
    listeners: {},
    addEventListener(type, listener) { this.listeners[type] = listener; },
    setAttribute(name, value) { this.attributes[name] = value; },
    append(child) {
      if (child.parent) {
        child.parent.children = child.parent.children.filter(item => item !== child);
      }
      child.parent = this;
      this.children.push(child);
    },
    replaceChildren() { this.children = []; },
    focus() { this.focused = true; },
    dispatch(type) {
      return this.listeners[type]({ preventDefault() {} });
    }
  };
}

function loadScript(context, filename) {
  const source = fs.readFileSync(path.join(PROJECT_ROOT, 'js', filename), 'utf8');
  vm.runInContext(source, context, { filename });
}

function createBrowserFixture({ correctText, clipboard } = {}) {
  const html = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
  const elements = new Map();
  for (const match of html.matchAll(/id="([^"]+)"/g)) {
    elements.set(match[1], createElement(match[1]));
  }
  elements.get('standardWorkspaceSlot').append(elements.get('workspace'));

  const classes = new Set();
  const errors = [];
  const copiedTexts = [];
  const document = {
    getElementById: id => elements.get(id),
    createElement: () => createElement(''),
    body: { classList: { toggle(name, active) {
      if (active) classes.add(name);
      else classes.delete(name);
    } } }
  };
  const context = vm.createContext({
    document,
    console: { error: (...args) => errors.push(args) },
    navigator: { clipboard: clipboard === undefined
      ? { async writeText(text) { copiedTexts.push(text); } } : clipboard },
    scrollTo() {},
    addEventListener() {}
  });
  loadScript(context, 'correction-service.js');
  if (correctText) context.Declic.correctText = correctText;
  loadScript(context, 'editor-view.js');
  loadScript(context, 'app.js');
  return { elements, context, document, classes, errors, copiedTexts };
}

module.exports = { PROJECT_ROOT, createBrowserFixture, loadScript };
