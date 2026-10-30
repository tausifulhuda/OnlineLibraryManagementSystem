const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, DAY } = require('./helpers');
const { createPolicy } = require('../src/policies/PolicyFactory');

test('factory returns the right policy for each member type', () => {
  assert.equal(createPolicy('student').maxLoans, 3);
  assert.equal(createPolicy('teacher').maxLoans, 5);
  assert.throws(() => createPolicy('alien'), /No policy/);
});

test('teachers get 30 days, students get 14', () => {
  const { lib } = setup();
  const student = lib.members.register({ name: 'S', type: 'student' });
  const teacher = lib.members.register({ name: 'T', type: 'teacher' });
  const book = lib.catalog.addBook({ title: 'A', author: 'B', copies: 2 });
  const s = lib.loans.borrow(student.id, book.id);
  const t = lib.loans.borrow(teacher.id, book.id);
  assert.equal(new Date(s.dueAt) - new Date(s.borrowedAt), 14 * DAY);
  assert.equal(new Date(t.dueAt) - new Date(t.borrowedAt), 30 * DAY);
});

test('student limit is 3 books, teacher limit is 5', () => {
  const { lib } = setup();
  const student = lib.members.register({ name: 'S', type: 'student' });
  const teacher = lib.members.register({ name: 'T', type: 'teacher' });
  for (let i = 1; i <= 10; i++) lib.catalog.addBook({ title: `B${i}`, author: 'A', copies: 1 });

  [1, 2, 3].forEach(id => lib.loans.borrow(student.id, id));
  assert.throws(() => lib.loans.borrow(student.id, 4), /Borrow limit reached \(3 books for a student\)/);

  [4, 5, 6, 7, 8].forEach(id => lib.loans.borrow(teacher.id, id));
  assert.throws(() => lib.loans.borrow(teacher.id, 9), /Borrow limit reached \(5 books for a teacher\)/);
});

test('no fine when returned on time', () => {
  const { lib, clock } = setup();
  const m = lib.members.register({ name: 'R', type: 'student' });
  const b = lib.catalog.addBook({ title: 'A', author: 'B' });
  const loan = lib.loans.borrow(m.id, b.id);
  clock.advanceDays(14);                                 // exactly on the due date
  assert.equal(lib.loans.returnBook(loan.id).fine, 0);
});

test('student pays 5 per late day', () => {
  const { lib, clock } = setup();
  const m = lib.members.register({ name: 'R', type: 'student' });
  const b = lib.catalog.addBook({ title: 'A', author: 'B' });
  const loan = lib.loans.borrow(m.id, b.id);
  clock.advanceDays(14 + 4);                             // 4 days late
  assert.equal(lib.loans.returnBook(loan.id).fine, 20);
});

test('teacher pays 2 per late day', () => {
  const { lib, clock } = setup();
  const m = lib.members.register({ name: 'T', type: 'teacher' });
  const b = lib.catalog.addBook({ title: 'A', author: 'B' });
  const loan = lib.loans.borrow(m.id, b.id);
  clock.advanceDays(30 + 4);
  assert.equal(lib.loans.returnBook(loan.id).fine, 8);
});

test('part of a day late counts as a full day', () => {
  const { lib, clock } = setup();
  const m = lib.members.register({ name: 'R', type: 'student' });
  const b = lib.catalog.addBook({ title: 'A', author: 'B' });
  const loan = lib.loans.borrow(m.id, b.id);
  clock.advanceDays(14.1);
  assert.equal(lib.loans.returnBook(loan.id).fine, 5);
});

test('active loans show an estimated fine while overdue', () => {
  const { lib, clock } = setup();
  const m = lib.members.register({ name: 'R', type: 'student' });
  const b = lib.catalog.addBook({ title: 'A', author: 'B' });
  lib.loans.borrow(m.id, b.id);
  clock.advanceDays(16);
  const [loan] = lib.loans.activeLoans(m.id);
  assert.equal(loan.daysLate, 2);
  assert.equal(loan.estimatedFine, 10);
});