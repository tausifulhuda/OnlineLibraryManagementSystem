# Online Library Management System

A lightweight online library management system built with plain Node.js. It provides a browser-based interface and a JSON HTTP API for managing books, members, loans, reservations, fines, and availability notifications.

The project is intentionally dependency-free and uses only Node.js built-in modules. Its codebase demonstrates several common object-oriented design patterns while remaining small enough to run locally and inspect easily.

## Features

- Add, search, and remove books
- Track multiple copies and current availability
- Register student and teacher members
- Borrow and return books
- Enforce member-specific borrowing limits and loan periods
- Calculate overdue fines
- Reserve books that are currently unavailable
- Notify the first waiting member when a reserved book is returned
- Persist books, members, loans, reservations, and notifications as JSON files
- Serve a responsive browser UI from the same Node.js server
- Expose the core functionality through a JSON HTTP API
- Run the full test suite with Node's built-in test runner

## Requirements

- Node.js 20 or newer
- npm (included with Node.js)

No third-party packages are required.

## Getting started

Clone the repository and start the server:

```bash
git clone https://github.com/tausifulhuda/OnlineLibraryManagementSystem.git
cd OnlineLibraryManagementSystem
npm start
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

The port can be changed with the `PORT` environment variable:

```bash
PORT=8080 npm start
```

On startup, the production entry point creates a library backed by the `data/` directory. The directory and its JSON files are created as records are written.

## Running tests

```bash
npm test
```

The tests use an in-memory library and an injectable clock, so they do not depend on files created by a running server or on the current system time.

## Using the web interface

The home page provides controls for:

- Searching the catalog by title, author, or ISBN
- Adding and removing books
- Adding student or teacher members
- Selecting the active member
- Borrowing available books
- Reserving unavailable books
- Viewing active loans and live overdue fine estimates
- Returning books
- Viewing reservation notifications

Choose a member from the **Signed in as** selector before borrowing or reserving a book.

## HTTP API

All API responses are JSON. Successful `POST` requests return `201`. Successful `GET` and `DELETE` requests return `200`.

### Books

#### List or search books

```http
GET /api/books
GET /api/books?q=clean
```

The optional `q` query parameter performs a case-insensitive search against the title, author, and ISBN. An empty query returns every book.

#### Add a book

```http
POST /api/books
Content-Type: application/json

{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "copies": 2
}
```

`title` and `author` are required. `copies` must be a whole number greater than or equal to `1`; it defaults to `1`. `isbn` is optional.

#### Remove a book

```http
DELETE /api/books/:bookId
```

A book cannot be removed while any of its copies are on loan.

### Members

#### List members

```http
GET /api/members
```

#### Register a member

```http
POST /api/members
Content-Type: application/json

{
  "name": "Rafi",
  "type": "student"
}
```

`name` is required. `type` must be either `student` or `teacher`; it defaults to `student`.

#### List a member's active loans

```http
GET /api/members/:memberId/loans
```

Each active loan includes the loan data, the book title, `daysLate`, and an `estimatedFine`. The estimate is recalculated from the current time and does not alter the stored loan until the book is returned.

#### List a member's notifications

```http
GET /api/members/:memberId/notifications
```

### Loans

#### Borrow a book

```http
POST /api/loans
Content-Type: application/json

{
  "memberId": 1,
  "bookId": 1
}
```

Borrowing decreases the book's available-copy count and creates a loan with a calculated due date.

#### Return a book

```http
POST /api/loans/:loanId/return
```

Returning restores one available copy, calculates the final fine, and notifies the first waiting reservation, if one exists.

### Reservations

#### Reserve an unavailable book

```http
POST /api/reservations
Content-Type: application/json

{
  "memberId": 2,
  "bookId": 1
}
```

A reservation is only allowed when all copies are currently borrowed. A member may not have more than one waiting reservation for the same book.

## Business rules

| Member type | Maximum active loans | Loan period | Fine per late day |
| --- | ---: | ---: | ---: |
| Student | 3 | 14 days | 5 BDT |
| Teacher | 5 | 30 days | 2 BDT |

Additional rules:

- A member cannot borrow two copies of the same book at the same time.
- A book with no available copies cannot be borrowed; it can be reserved instead.
- A reservation queue is processed in creation order.
- Returning a book notifies only the first waiting member.
- A partial late day counts as one full late day.
- A loan returned on or before its due date has no fine.
- Returning an already returned loan is rejected.
- Unknown books, members, and loans return not-found errors.

## Example API flow

The following commands create a book and member, borrow the book, inspect the loan, and return it:

```bash
book_id=$(
  curl -s -X POST http://localhost:3000/api/books \
    -H 'Content-Type: application/json' \
    -d '{"title":"Clean Code","author":"Robert C. Martin","copies":1}' |
  node -e 'let input=""; process.stdin.on("data", chunk => input += chunk).on("end", () => console.log(JSON.parse(input).id))'
)

member_id=$(
  curl -s -X POST http://localhost:3000/api/members \
    -H 'Content-Type: application/json' \
    -d '{"name":"Rafi","type":"student"}' |
  node -e 'let input=""; process.stdin.on("data", chunk => input += chunk).on("end", () => console.log(JSON.parse(input).id))'
)

curl -s -X POST http://localhost:3000/api/loans \
  -H 'Content-Type: application/json' \
  -d "{\"memberId\":$member_id,\"bookId\":$book_id}"

curl -s "http://localhost:3000/api/members/$member_id/loans"
```

To return a book, use the `id` from the loan response:

```bash
curl -s -X POST "http://localhost:3000/api/loans/<loan_id>/return"
```

## Persistence

The application supports two storage modes:

- **In-memory mode:** `createLibrary()` uses repositories without file paths. This is used by tests and is useful for short-lived integrations.
- **JSON-file mode:** `createLibrary({ dataDir: 'data' })` stores each repository in a separate JSON file.

The server uses JSON-file mode and writes:

```text
data/
├── books.json
├── members.json
├── loans.json
├── reservations.json
└── notifications.json
```

The repository abstraction keeps storage concerns out of the service layer, so a database-backed repository could be introduced later without changing the domain services.

## Architecture

The application is organized into a small MVC-style HTTP layer and domain services:

```text
Browser UI
    │
    ├── public/index.html, public/app.js, public/style.css
    │
HTTP server
    │
    ├── src/app.js              Static-file serving and request handling
    └── src/controllers/api.js  API route definitions
    │
Domain facade
    │
    └── src/Library.js          Creates and wires the application services
         ├── CatalogService
         ├── MemberService
         ├── LoanService
         └── ReservationService
              │
              ├── Models: Book, Member, Loan
              ├── Repositories: in-memory or JSON-backed storage
              ├── Policies: student and teacher borrowing/fine strategies
              └── EventBus: return notifications
```

The implementation uses these patterns:

- **Facade:** `src/Library.js` provides one factory for constructing the complete system.
- **Repository:** `src/repositories/Repository.js` isolates storage operations.
- **Strategy:** membership policy classes encapsulate loan limits, loan periods, and fine calculations.
- **Factory:** `src/policies/PolicyFactory.js` selects a policy from the member type.
- **Observer:** `EventBus` allows reservation handling to react to `book.returned` events.

## Project structure

```text
.
├── public/
│   ├── app.js                 Browser client and API interactions
│   ├── index.html             Main page
│   ├── style.css              Responsive styling
│   └── images/                Logo and background assets
├── src/
│   ├── controllers/api.js     HTTP route definitions
│   ├── events/EventBus.js    Event subscription and publishing
│   ├── models/               Book, Member, and Loan entities
│   ├── policies/             Membership strategies and factory
│   ├── repositories/         In-memory/JSON repository
│   ├── services/             Catalog, member, loan, and reservation logic
│   ├── Library.js            Application composition facade
│   ├── app.js                HTTP application and static files
│   ├── errors.js             HTTP-aware application errors
│   └── server.js             Production entry point
├── tests/
│   ├── increment1-catalog.test.js
│   ├── increment2-borrowing.test.js
│   ├── increment3-fines.test.js
│   ├── increment4-reservations.test.js
│   ├── increment5-api.test.js
│   └── helpers.js
└── package.json
```

## Error responses

Errors use a consistent JSON shape:

```json
{
  "error": "No copies available. You can reserve this book instead"
}
```

Typical status codes:

- `400 Bad Request` — invalid JSON or validation failure
- `404 Not Found` — unknown route or entity
- `409 Conflict` — a valid request that violates a library rule
- `500 Internal Server Error` — unexpected server failure

## Development notes

- The server uses Node's built-in `http`, `fs`, and `path` modules rather than a web framework.
- Dates are stored as ISO 8601 strings.
- IDs are generated independently by each repository and start at `1`.
- The injected `now` function makes time-dependent behavior deterministic in tests.
- The browser client escapes displayed user-provided text before inserting it into HTML.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
