const { RuleError } = require('../errors');

class ReservationService {
  constructor({ catalog, members, reservations, notifications, events, now = () => new Date() }) {
    this.catalog = catalog;
    this.members = members;
    this.reservations = reservations;
    this.notifications = notifications;
    this.now = now;

    // Observer: when any book is returned, tell the first person waiting for it.
    events.on('book.returned', ({ book }) => this.notifyNext(book));
  }

  reserve(memberId, bookId) {
    const member = this.members.get(memberId);
    const book = this.catalog.getBook(bookId);
    if (book.isAvailable) throw new RuleError('This book is available now. Borrow it instead');

    const already = this.reservations.find(r =>
      r.status === 'waiting' && r.memberId === member.id && r.bookId === book.id);
    if (already.length) throw new RuleError('You are already waiting for this book');

    return this.reservations.add({
      memberId: member.id,
      bookId: book.id,
      status: 'waiting',
      createdAt: this.now().toISOString(),
    });
  }

  queue(bookId) {
    return this.reservations.find(r => r.status === 'waiting' && r.bookId === Number(bookId));
  }

  notifyNext(book) {
    const [next] = this.queue(book.id);      // oldest first (ids increase)
    if (!next) return null;
    next.status = 'notified';
    this.reservations.update(next);
    return this.notifications.add({
      memberId: next.memberId,
      message: `"${book.title}" is available now. Please borrow it soon.`,
      createdAt: this.now().toISOString(),
    });
  }

  notificationsFor(memberId) {
    return this.notifications.find(n => n.memberId === Number(memberId));
  }
}

module.exports = ReservationService;