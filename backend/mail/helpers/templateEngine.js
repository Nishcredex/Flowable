const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { TemplateNotFoundError, TemplateCompilationError } = require('../utils/mailErrors');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const PARTIALS_DIR = path.join(TEMPLATES_DIR, 'partials');

// Compiled-template cache so we don't re-read/re-compile from disk on every send.
const compiledCache = new Map();

// ── Register shared partials (header/footer/button) ────────────────
function registerPartials() {
  if (!fs.existsSync(PARTIALS_DIR)) return;
  fs.readdirSync(PARTIALS_DIR)
    .filter((f) => f.endsWith('.hbs'))
    .forEach((f) => {
      const name = f.replace(/\.hbs$/, '');
      const source = fs.readFileSync(path.join(PARTIALS_DIR, f), 'utf8');
      handlebars.registerPartial(name, source);
    });
}
registerPartials();

// ── Handlebars helpers ──────────────────────────────────────────────
handlebars.registerHelper('formatDate', (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
});

handlebars.registerHelper('default', (value, fallback) => (value ? value : fallback));

handlebars.registerHelper('year', () => new Date().getFullYear());

function listTemplates() {
  return fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith('.hbs'))
    .map((f) => f.replace(/\.hbs$/, ''));
}

function templatePath(templateName) {
  return path.join(TEMPLATES_DIR, `${templateName}.hbs`);
}

function templateExists(templateName) {
  return fs.existsSync(templatePath(templateName));
}

/**
 * Loads + compiles a .hbs template by name (no extension), caching the compiled
 * function so subsequent sends of the same template are fast.
 */
function getCompiledTemplate(templateName) {
  if (compiledCache.has(templateName)) {
    return compiledCache.get(templateName);
  }

  if (!templateExists(templateName)) {
    throw new TemplateNotFoundError(templateName);
  }

  try {
    const source = fs.readFileSync(templatePath(templateName), 'utf8');
    const compiled = handlebars.compile(source);
    compiledCache.set(templateName, compiled);
    return compiled;
  } catch (err) {
    throw new TemplateCompilationError(templateName, err.message);
  }
}

/**
 * Renders a template with the given context, returning the final HTML string.
 */
function renderTemplate(templateName, context = {}) {
  const compiled = getCompiledTemplate(templateName);
  try {
    return compiled(context);
  } catch (err) {
    throw new TemplateCompilationError(templateName, err.message);
  }
}

/** Clears the compiled-template cache (useful in dev while editing .hbs files). */
function clearCache() {
  compiledCache.clear();
}

module.exports = {
  listTemplates,
  templateExists,
  renderTemplate,
  clearCache,
};
