// Small error hierarchy so controllers can map errors to HTTP status codes.
class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}
class ValidationError extends AppError { constructor(m) { super(m, 400); } }
class NotFoundError extends AppError { constructor(m) { super(m, 404); } }
class RuleError extends AppError { constructor(m) { super(m, 409); } }

module.exports = { AppError, ValidationError, NotFoundError, RuleError };