const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, DAY } = require('./helpers');

function seed(lib) {
  const member = lib.members.register({ name: 'Rafi', type: 'student' });
  const book = lib.catalog.addBook({ title: 'Book A', author: 'Author', copies: 1 });
  return { member, book };
}

test('registers a member', () => {
  const { lib } = setup();
  const member = lib.members.register({ name: 'Rafi', type: 'teacher' });
  assert.equal(lib.members.get(member.id).name, 'Rafi');
});

test('rejects a member with no name or a wrong type', () => {
  const { lib } = setup();
  assert.throws(() => lib.members.register({ type: 'student' }), /Name is required/);
  assert.throws(() => lib.members.register({ name: 'X', type: 'alien' }), /must be one of/);
});

test('borrowing reduces available copies and sets a 14-day due date', () => {
  const { lib } = setup();
  const { member, book } = seed(lib);
  const loan = lib.loans.borrow(member.id, book.id);
  assert.equal(lib.catalog.getBook(book.id).available, 0);
  assert.equal(new Date(loan.dueAt) - new Date(loan.borrowedAt), 14 * DAY);
});

test('cannot borrow a book with no copies left', () => {
  const { lib } = setup();
  const { member: first, book } = seed(lib);
  const other = lib.members.register({ name: 'Nila', type: 'student' });
  lib.loans.borrow(first.id, book.id);
  assert.throws(() => lib.loans.borrow(other.id, book.id), /No copies available/);
});

test('a member can borrow at most 3 books at once', () => {
  const { lib } = setup();
  const member = lib.members.register({ name: 'S', type: 'student' });
  for (let i = 1; i <= 4; i++) lib.catalog.addBook({ title: `B${i}`, author: 'A', copies: 1 });

  [1, 2, 3].forEach(id => lib.loans.borrow(member.id, id));
  assert.throws(() => lib.loans.borrow(member.id, 4), /Borrow limit reached \(3/);
});

test('same member cannot borrow two copies of the same book', () => {
  const { lib } = setup();
  const member = lib.members.register({ name: 'R', type: 'student' });
  const book = lib.catalog.addBook({ title: 'Twin', author: 'A', copies: 2 });
  lib.loans.borrow(member.id, book.id);
  assert.throws(() => lib.loans.borrow(member.id, book.id), /already has a copy/);
});

test('unknown member or book is rejected', () => {
  const { lib } = setup();
  const { member, book } = seed(lib);
  assert.throws(() => lib.loans.borrow(99, book.id), /Member 99 not found/);
  assert.throws(() => lib.loans.borrow(member.id, 99), /Book 99 not found/);
});

test('returning a book makes it available again and cannot be done twice', () => {
  const { lib } = setup();
  const { member, book } = seed(lib);
  const loan = lib.loans.borrow(member.id, book.id);
  lib.loans.returnBook(loan.id);
  assert.equal(lib.catalog.getBook(book.id).available, 1);
  assert.equal(lib.loans.activeLoans(member.id).length, 0);
  assert.throws(() => lib.loans.returnBook(loan.id), /already returned/);
});

test('a book on loan cannot be removed from the catalog', () => {
  const { lib } = setup();
  const { member, book } = seed(lib);
  lib.loans.borrow(member.id, book.id);
  assert.throws(() => lib.catalog.removeBook(book.id), /on loan/);
});