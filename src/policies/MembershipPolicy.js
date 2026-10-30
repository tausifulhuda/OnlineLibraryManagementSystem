/** Strategy interface: borrowing limits and fine rules per member type. */
class MembershipPolicy {
  get maxLoans() { throw new Error('not implemented'); }
  get loanDays() { throw new Error('not implemented'); }
  calculateFine(daysLate) { throw new Error('not implemented'); }
}

module.exports = MembershipPolicy;