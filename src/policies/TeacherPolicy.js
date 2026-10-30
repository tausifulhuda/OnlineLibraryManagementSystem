const MembershipPolicy = require('./MembershipPolicy');

class TeacherPolicy extends MembershipPolicy {
  get maxLoans() { return 5; }
  get loanDays() { return 30; }
  calculateFine(daysLate) { return daysLate > 0 ? daysLate * 2 : 0; }   // 2 BDT per late day
}

module.exports = TeacherPolicy;