class Loan {
  constructor({ id = null, memberId, bookId, borrowedAt, dueAt, returnedAt = null, fine = 0 }) {
    this.id = id;
    this.memberId = memberId;
    this.bookId = bookId;
    this.borrowedAt = borrowedAt;   // ISO string
    this.dueAt = dueAt;             // ISO string
    this.returnedAt = returnedAt;   // ISO string or null
    this.fine = fine;
  }

  get isActive() { return this.returnedAt === null; }
}

module.exports = Loan;