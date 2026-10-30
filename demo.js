// Run with: npm run demo
// Walks through Increment 4 in the terminal (reservations and notifications).
// Memory only, so output repeats.
const { createLibrary } = require('./src/Library');

const lib = createLibrary();

const book = lib.catalog.addBook({ title: 'Clean Code', author: 'Robert Martin', copies: 1 });
const rafi = lib.members.register({ name: 'Rafi', type: 'student' });
const nila = lib.members.register({ name: 'Nila', type: 'student' });
const sami = lib.members.register({ name: 'Sami', type: 'student' });

const loan = lib.loans.borrow(rafi.id, book.id);
console.log('Rafi borrowed the only copy.');

lib.reservations.reserve(nila.id, book.id);
lib.reservations.reserve(sami.id, book.id);
console.log(`Nila and Sami reserved it. Queue length: ${lib.reservations.queue(book.id).length}`);

lib.loans.returnBook(loan.id);
console.log('\nRafi returns the book...');

for (const person of [nila, sami]) {
  const notes = lib.reservations.notificationsFor(person.id);
  console.log(`${person.name}'s notifications: ${notes.length ? notes[0].message : 'none yet'}`);
}
console.log(`Still waiting: ${lib.reservations.queue(book.id).length}`);