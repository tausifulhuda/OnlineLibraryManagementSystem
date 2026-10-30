const Loan = require('../models/Loan');
const { NotFoundError, RuleError } = require('../errors');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_LOANS = 3;     // same limit for everyone (Increment 3 makes this depend on member type)
const LOAN_DAYS = 14;    // same loan period for everyone

class LoanService {
  /**
   * deps: catalog (CatalogService), members (MemberService), loans (Repository),
   *       now (function returning a Date; injectable so tests can control time)
   */
  constructor({ catalog, members, loans, now = () => new Date() }) {
    this.catalog = catalog;
    this.members = members;
    this.loans = loans;
    this.now = now;
  }

  borrow(memberId, bookId) {
    const member = this.members.get(memberId);
    const book = this.catalog.getBook(bookId);

    const active = this.loans.find(l => l.isActive && l.memberId === member.id);
    if (active.length >= MAX_LOANS) {
      throw new RuleError(`Borrow limit reached (${MAX_LOANS} books)`);
    }
    if (active.some(l => l.bookId === book.id)) {
      throw new RuleError('This member already has a copy of this book');
    }
    if (!book.isAvailable) throw new RuleError('No copies available');

    const borrowedAt = this.now();
    const dueAt = new Date(borrowedAt.getTime() + LOAN_DAYS * DAY_MS);

    book.available -= 1;
    this.catalog.books.update(book);

    return this.loans.add(new Loan({
      memberId: member.id,
      bookId: book.id,
      borrowedAt: borrowedAt.toISOString(),
      dueAt: dueAt.toISOString(),
    }));
  }

  returnBook(loanId) {
    const loan = this.loans.get(loanId);
    if (!loan) throw new NotFoundError(`Loan ${loanId} not found`);
    if (!loan.isActive) throw new RuleError('This loan was already returned');

    const book = this.catalog.getBook(loan.bookId);

    loan.returnedAt = this.now().toISOString();
    this.loans.update(loan);

    book.available += 1;
    this.catalog.books.update(book);
    return loan;
  }

  /** Books a member currently has. */
  activeLoans(memberId) {
    const member = this.members.get(memberId);
    return this.loans.find(l => l.isActive && l.memberId === member.id);
  }

  list({ memberId } = {}) {
    return memberId ? this.loans.find(l => l.memberId === Number(memberId)) : this.loans.all();
  }
}

module.exports = LoanService;