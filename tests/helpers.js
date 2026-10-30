const { createLibrary } = require('../src/Library');

const DAY = 24 * 60 * 60 * 1000;

/** Builds an in-memory library with a clock the test can move forward. */
function setup() {
  const clock = { time: new Date('2026-01-01T10:00:00Z') };
  const lib = createLibrary({ now: () => new Date(clock.time) });
  clock.advanceDays = days => { clock.time = new Date(clock.time.getTime() + days * DAY); };
  return { lib, clock };
}

module.exports = { setup, DAY };