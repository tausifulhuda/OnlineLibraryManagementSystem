const path = require('node:path');
const Repository = require('./repositories/Repository');
const Book = require('./models/Book');
const CatalogService = require('./services/CatalogService');

/**
 * Facade pattern: one call builds and wires the whole system.
 * dataDir = null   -> everything stays in memory (used by tests)
 * dataDir = 'data' -> saved as JSON files in that folder
 */
function createLibrary({ dataDir = null } = {}) {
  const file = name => (dataDir ? path.join(dataDir, `${name}.json`) : null);

  const catalog = new CatalogService(new Repository(file('books'), Book));

  return { catalog };
}

module.exports = { createLibrary };