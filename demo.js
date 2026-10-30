// Run with: npm run demo
// Walks through Increment 3 in the terminal (due dates and fines).
// A fake clock lets us "wait" several weeks instantly. Memory only, so output repeats.
const { createLibrary } = require('./src/Library');

const DAY = 24 * 60 * 60 * 1000;
let time = new Date('2026-01-01T10:00:00Z');
const lib = createLibrary({ now: () => new Date(time) });
const wait = days => { time = new Date(time.getTime() + days * DAY); };

const student = lib.members.register({ name: 'Rafi', type: 'student' });
const teacher = lib.members.register({ name: 'Dr. Karim', type: 'teacher' });
const book = lib.catalog.addBook({ title: 'Computer Networks', author: 'Tanenbaum', copies: 2 });

const s = lib.loans.borrow(student.id, book.id);
const t = lib.loans.borrow(teacher.id, book.id);
console.log(`Rafi (student) must return it by ${new Date(s.dueAt).toDateString()}`);
console.log(`Dr. Karim (teacher) must return it by ${new Date(t.dueAt).toDateString()}`);

wait(19);   // 5 days after the student's due date, still before the teacher's
const [open] = lib.loans.activeLoans(student.id);
console.log(`\n19 days later, Rafi is ${open.daysLate} days late (estimated fine ${open.estimatedFine})`);

const returned = lib.loans.returnBook(s.id);
console.log(`Rafi returns the book and pays a fine of ${returned.fine}`);

wait(16);   // 35 days after borrowing: the teacher is now 5 days late
console.log(`Dr. Karim returns it 5 days late and pays ${lib.loans.returnBook(t.id).fine}`);