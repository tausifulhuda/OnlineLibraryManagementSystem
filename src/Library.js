const path = require('node:path');
const Repository = require('./repositories/Repository');
const Book = require('./models/Book');
const Member = require('./models/Member');
const Loan = require('./models/Loan');
const EventBus = require('./events/EventBus');
const CatalogService = require('./services/CatalogService');
const MemberService = require('./services/MemberService');
const LoanService = require('./services/LoanService');
const ReservationService = require('./services/ReservationService');

/**
 * Facade pattern: one call builds and wires the whole system.
 * dataDir = null   -> everything stays in memory (used by tests)
 * dataDir = 'data' -> saved as JSON files in that folder
 */
function createLibrary({ dataDir = null, now = () => new Date() } = {}) {
  const file = name => (dataDir ? path.join(dataDir, `${name}.json`) : null);

  const events = new EventBus();
  const catalog = new CatalogService(new Repository(file('books'), Book));
  const members = new MemberService(new Repository(file('members'), Member));
  const loans = new LoanService({ catalog, members, loans: new Repository(file('loans'), Loan), events, now });
  const reservations = new ReservationService({
    catalog, members, events, now,
    reservations: new Repository(file('reservations')),
    notifications: new Repository(file('notifications')),
  });

  return { catalog, members, loans, reservations, events };
}

module.exports = { createLibrary };