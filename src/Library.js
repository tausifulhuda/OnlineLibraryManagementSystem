const path = require('node:path');
const Repository = require('./repositories/Repository');
const Book = require('./models/Book');
const Member = require('./models/Member');
const Loan = require('./models/Loan');
const CatalogService = require('./services/CatalogService');
const MemberService = require('./services/MemberService');
const LoanService = require('./services/LoanService');

/**
 * Facade pattern: one call builds and wires the whole system.
 * dataDir = null   -> everything stays in memory (used by tests)
 * dataDir = 'data' -> saved as JSON files in that folder
 */
function createLibrary({ dataDir = null, now = () => new Date() } = {}) {
  const file = name => (dataDir ? path.join(dataDir, `${name}.json`) : null);

  const catalog = new CatalogService(new Repository(file('books'), Book));
  const members = new MemberService(new Repository(file('members'), Member));
  const loans = new LoanService({ catalog, members, loans: new Repository(file('loans'), Loan), now });

  return { catalog, members, loans };
}

module.exports = { createLibrary };