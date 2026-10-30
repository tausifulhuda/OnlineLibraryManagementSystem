const Member = require('../models/Member');
const { NotFoundError } = require('../errors');

class MemberService {
  constructor(memberRepo) { this.members = memberRepo; }

  register(data) { return this.members.add(new Member(data)); }

  get(id) {
    const member = this.members.get(id);
    if (!member) throw new NotFoundError(`Member ${id} not found`);
    return member;
  }

  list() { return this.members.all(); }
}

module.exports = MemberService;