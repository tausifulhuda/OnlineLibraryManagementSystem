const { ValidationError } = require('../errors');

class Book {
  constructor({ id = null, title, author, isbn = '', copies = 1, available = copies }) {
    if (!title || !String(title).trim()) throw new ValidationError('Title is required');
    if (!author || !String(author).trim()) throw new ValidationError('Author is required');
    if (!Number.isInteger(copies) || copies < 1) throw new ValidationError('Copies must be a whole number of at least 1');
    this.id = id;
    this.title = String(title).trim();
    this.author = String(author).trim();
    this.isbn = String(isbn).trim();
    this.copies = copies;
    this.available = available;
  }

  get isAvailable() { return this.available > 0; }
}

module.exports = Book;