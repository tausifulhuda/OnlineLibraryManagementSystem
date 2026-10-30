const { ValidationError } = require('../errors');

const TYPES = ['student', 'teacher'];

class Member {
  constructor({ id = null, name, type = 'student' }) {
    if (!name || !String(name).trim()) throw new ValidationError('Name is required');
    if (!TYPES.includes(type)) throw new ValidationError(`Member type must be one of: ${TYPES.join(', ')}`);
    this.id = id;
    this.name = String(name).trim();
    this.type = type;
  }
}

Member.TYPES = TYPES;
module.exports = Member;