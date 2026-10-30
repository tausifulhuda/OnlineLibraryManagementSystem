const test = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./helpers');

test('adds a book and finds it again', () => {
  const { lib } = setup();
  const book = lib.catalog.addBook({ title: 'Clean Code', author: 'Robert Martin', copies: 2 });
  assert.equal(lib.catalog.getBook(book.id).title, 'Clean Code');
  assert.equal(book.available, 2);
});

test('each new book gets its own id', () => {
  const { lib } = setup();
  const a = lib.catalog.addBook({ title: 'A', author: 'X' });
  const b = lib.catalog.addBook({ title: 'B', author: 'Y' });
  assert.notEqual(a.id, b.id);
});

test('rejects a book with no title', () => {
  const { lib } = setup();
  assert.throws(() => lib.catalog.addBook({ author: 'Someone' }), /Title is required/);
});

test('rejects zero copies', () => {
  const { lib } = setup();
  assert.throws(() => lib.catalog.addBook({ title: 'X', author: 'Y', copies: 0 }), /at least 1/);
});

test('search matches title and author, ignoring case', () => {
  const { lib } = setup();
  lib.catalog.addBook({ title: 'Clean Code', author: 'Robert Martin' });
  lib.catalog.addBook({ title: 'Algorithms', author: 'Sedgewick' });
  assert.equal(lib.catalog.search('clean').length, 1);
  assert.equal(lib.catalog.search('SEDGE').length, 1);
  assert.equal(lib.catalog.search('').length, 2);
});

test('removes a book from the catalog', () => {
  const { lib } = setup();
  const book = lib.catalog.addBook({ title: 'Old Book', author: 'A' });
  lib.catalog.removeBook(book.id);
  assert.throws(() => lib.catalog.getBook(book.id), /not found/);
});

test('unknown book id throws not found', () => {
  const { lib } = setup();
  assert.throws(() => lib.catalog.getBook(99), /not found/);
});