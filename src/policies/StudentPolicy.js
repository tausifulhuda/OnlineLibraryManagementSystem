const MembershipPolicy = require('./MembershipPolicy');

class StudentPolicy extends MembershipPolicy {
  get maxLoans() { return 3; }
  get loanDays() { return 14; }
  calculateFine(daysLate) { return daysLate > 0 ? daysLate * 5 : 0; }   // 5 BDT per late day
}

module.exports = StudentPolicy;