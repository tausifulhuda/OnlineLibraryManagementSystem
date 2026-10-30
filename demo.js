// Run with: npm run demo
// Walks through Increment 2 in the terminal (borrowing and returning).
// It uses memory only, so every run gives the same output.
const { createLibrary } = require('./src/Library');

const lib = createLibrary();

const book = lib.catalog.addBook({ title: 'Clean Code', author: 'Robert Martin', copies: 1 });
const rafi = lib.members.register({ name: 'Rafi', type: 'student' });
const nila = lib.members.register({ name: 'Nila', type: 'student' });

const loan = lib.loans.borrow(rafi.id, book.id);
console.log(`Rafi borrowed "${book.title}", due ${new Date(loan.dueAt).toDateString()}`);
console.log(`Copies available now: ${lib.catalog.getBook(book.id).available}`);

try {
  lib.loans.borrow(nila.id, book.id);
} catch (err) {
  console.log(`Nila tried to borrow it: ${err.message}`);
}

lib.loans.returnBook(loan.id);
console.log(`Rafi returned it. Copies available now: ${lib.catalog.getBook(book.id).available}`);

lib.loans.borrow(nila.id, book.id);
console.log(`Nila borrowed it. Her loans: ${lib.loans.activeLoans(nila.id).length}`);