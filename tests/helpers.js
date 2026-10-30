const { createLibrary } = require('../src/Library');

/** Builds a fresh in-memory library for each test. */
function setup() {
  const lib = createLibrary();
  return { lib };
}

module.exports = { setup };