/** Controller layer: turns HTTP requests into service calls. */
function createRoutes(lib) {
  const bookTitle = id => lib.catalog.books.get(id)?.title ?? '(deleted book)';

  return [
    ['GET',    /^\/api\/books$/,                    ({ query }) => lib.catalog.search(query.get('q') || '')],
    ['POST',   /^\/api\/books$/,                    ({ body }) => lib.catalog.addBook(body)],
    ['DELETE', /^\/api\/books\/(\d+)$/,             ({ params }) => { lib.catalog.removeBook(params[0]); return { ok: true }; }],

    ['GET',    /^\/api\/members$/,                  () => lib.members.list()],
    ['POST',   /^\/api\/members$/,                  ({ body }) => lib.members.register(body)],
    ['GET',    /^\/api\/members\/(\d+)\/loans$/,    ({ params }) =>
      lib.loans.activeLoans(params[0]).map(l => ({ ...l, title: bookTitle(l.bookId) }))],
    ['GET',    /^\/api\/members\/(\d+)\/notifications$/, ({ params }) => lib.reservations.notificationsFor(params[0])],

    ['POST',   /^\/api\/loans$/,                    ({ body }) => lib.loans.borrow(body.memberId, body.bookId)],
    ['POST',   /^\/api\/loans\/(\d+)\/return$/,     ({ params }) => lib.loans.returnBook(params[0])],
    ['POST',   /^\/api\/reservations$/,             ({ body }) => lib.reservations.reserve(body.memberId, body.bookId)],
  ];
}

module.exports = { createRoutes };