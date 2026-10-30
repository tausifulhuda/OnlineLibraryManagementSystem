const test = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./helpers');

function scene() {
  const { lib } = setup();
  const holder = lib.members.register({ name: 'Holder', type: 'student' });
  const waiter1 = lib.members.register({ name: 'First', type: 'student' });
  const waiter2 = lib.members.register({ name: 'Second', type: 'student' });
  const book = lib.catalog.addBook({ title: 'Popular', author: 'A', copies: 1 });
  const loan = lib.loans.borrow(holder.id, book.id);
  return { lib, holder, waiter1, waiter2, book, loan };
}

test('cannot reserve a book that is available', () => {
  const { lib } = setup();
  const m = lib.members.register({ name: 'M', type: 'student' });
  const b = lib.catalog.addBook({ title: 'Free', author: 'A' });
  assert.throws(() => lib.reservations.reserve(m.id, b.id), /available now/);
});

test('can reserve a book that is fully borrowed', () => {
  const { lib, waiter1, book } = scene();
  const reservation = lib.reservations.reserve(waiter1.id, book.id);
  assert.equal(reservation.status, 'waiting');
  assert.equal(lib.reservations.queue(book.id).length, 1);
});

test('cannot reserve the same book twice', () => {
  const { lib, waiter1, book } = scene();
  lib.reservations.reserve(waiter1.id, book.id);
  assert.throws(() => lib.reservations.reserve(waiter1.id, book.id), /already waiting/);
});

test('returning the book notifies only the first person in the queue', () => {
  const { lib, waiter1, waiter2, book, loan } = scene();
  lib.reservations.reserve(waiter1.id, book.id);
  lib.reservations.reserve(waiter2.id, book.id);

  lib.loans.returnBook(loan.id);

  const first = lib.reservations.notificationsFor(waiter1.id);
  assert.equal(first.length, 1);
  assert.match(first[0].message, /Popular/);
  assert.equal(lib.reservations.notificationsFor(waiter2.id).length, 0);
  assert.equal(lib.reservations.queue(book.id).length, 1);   // second person still waiting
});

test('returning a book nobody wants creates no notifications', () => {
  const { lib, holder, loan } = scene();
  lib.loans.returnBook(loan.id);
  assert.equal(lib.reservations.notificationsFor(holder.id).length, 0);
});

test('event bus calls every subscriber of an event', () => {
  const { lib } = setup();
  const seen = [];
  lib.events.on('ping', x => seen.push(`a${x}`));
  lib.events.on('ping', x => seen.push(`b${x}`));
  lib.events.emit('ping', 1);
  assert.deepEqual(seen, ['a1', 'b1']);
});