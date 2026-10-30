const StudentPolicy = require('./StudentPolicy');
const TeacherPolicy = require('./TeacherPolicy');
const { ValidationError } = require('../errors');

/** Factory pattern: picks the right Strategy for a member type. */
const registry = {
  student: StudentPolicy,
  teacher: TeacherPolicy,
};

function createPolicy(memberType) {
  const Policy = registry[memberType];
  if (!Policy) throw new ValidationError(`No policy for member type "${memberType}"`);
  return new Policy();
}

module.exports = { createPolicy };