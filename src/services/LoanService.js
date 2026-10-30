const Loan = require('../models/Loan');
const { createPolicy } = require('../policies/PolicyFactory');
const { NotFoundError, RuleError } = require('../errors');

const DAY_MS = 24 * 60 * 60 * 1000;

class LoanService {
  /**
   * deps: catalog (CatalogService), members (MemberService), loans (Repository),
   *       events (EventBus), now (function returning a Date; injectable so tests control time)
   */
  constructor({ catalog, members, loans, events, now = () => new Date() }) {
    this.catalog = catalog;
    this.members = members;
    this.loans = loans;
    this.events = events;
    this.now = now;
  }

  borrow(memberId, bookId) {
    const member = this.members.get(memberId);
    const book = this.catalog.getBook(bookId);
    const policy = createPolicy(member.type);

    const active = this.loans.find(l => l.isActive && l.memberId === member.id);
    if (active.length >= policy.maxLoans) {
      throw new RuleError(`Borrow limit reached (${policy.maxLoans} books for a ${member.type})`);
    }
    if (active.some(l => l.bookId === book.id)) {
      throw new RuleError('This member already has a copy of this book');
    }
    if (!book.isAvailable) throw new RuleError('No copies available. You can reserve this book instead');

    const borrowedAt = this.now();
    const dueAt = new Date(borrowedAt.getTime() + policy.loanDays * DAY_MS);

    book.available -= 1;
    this.catalog.books.update(book);

    const loan = this.loans.add(new Loan({
      memberId: member.id,
      bookId: book.id,
      borrowedAt: borrowedAt.toISOString(),
      dueAt: dueAt.toISOString(),
    }));
    this.events.emit('book.borrowed', { loan, book, member });
    return loan;
  }

  returnBook(loanId) {
    const loan = this.loans.get(loanId);
    if (!loan) throw new NotFoundError(`Loan ${loanId} not found`);
    if (!loan.isActive) throw new RuleError('This loan was already returned');

    const member = this.members.get(loan.memberId);
    const book = this.catalog.getBook(loan.bookId);
    const returnedAt = this.now();

    loan.returnedAt = returnedAt.toISOString();
    loan.fine = createPolicy(member.type).calculateFine(this.daysLate(loan, returnedAt));
    this.loans.update(loan);

    book.available += 1;
    this.catalog.books.update(book);

    this.events.emit('book.returned', { loan, book, member });
    return loan;
  }

  daysLate(loan, at = this.now()) {
    const late = at.getTime() - new Date(loan.dueAt).getTime();
    return late > 0 ? Math.ceil(late / DAY_MS) : 0;
  }

  /** Current loans for a member, with live fine estimates for overdue ones. */
  activeLoans(memberId) {
    const member = this.members.get(memberId);
    const policy = createPolicy(member.type);
    return this.loans
      .find(l => l.isActive && l.memberId === member.id)
      .map(l => ({
        ...l,
        daysLate: this.daysLate(l),
        estimatedFine: policy.calculateFine(this.daysLate(l)),
      }));
  }

  list({ memberId } = {}) {
    return memberId ? this.loans.find(l => l.memberId === Number(memberId)) : this.loans.all();
  }
}

module.exports = LoanService;