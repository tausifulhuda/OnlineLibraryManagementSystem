const Book = require('../models/Book');
const { NotFoundError, RuleError } = require('../errors');

class CatalogService {
  constructor(bookRepo) { this.books = bookRepo; }

  addBook(data) {
    return this.books.add(new Book(data));
  }

  getBook(id) {
    const book = this.books.get(id);
    if (!book) throw new NotFoundError(`Book ${id} not found`);
    return book;
  }

  search(query = '') {
    const q = String(query).trim().toLowerCase();
    if (!q) return this.books.all();
    return this.books.find(b =>
      [b.title, b.author, b.isbn].some(field => field.toLowerCase().includes(q)));
  }

  removeBook(id) {
    const book = this.getBook(id);
    if (book.available < book.copies) throw new RuleError('Cannot remove a book while copies are on loan');
    this.books.remove(id);
  }
}

module.exports = CatalogService;