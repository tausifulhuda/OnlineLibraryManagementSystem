// Run with: npm run demo
// Shows Increment 1 working in the terminal. Data is saved in the "data" folder,
// so run it twice to see that the books are still there.
const path = require('node:path');
const { createLibrary } = require('./src/Library');

const lib = createLibrary({ dataDir: path.join(__dirname, 'data') });

if (lib.catalog.search('').length === 0) {
  lib.catalog.addBook({ title: 'Clean Code', author: 'Robert Martin', isbn: '9780132350884', copies: 2 });
  lib.catalog.addBook({ title: 'Algorithms', author: 'Robert Sedgewick', copies: 1 });
  lib.catalog.addBook({ title: 'Computer Networks', author: 'Andrew Tanenbaum', copies: 3 });
  console.log('Added 3 books.\n');
}

console.log('All books:');
for (const b of lib.catalog.search('')) {
  console.log(`  #${b.id} ${b.title} by ${b.author} (${b.available}/${b.copies} available)`);
}

console.log('\nSearch "robert":');
for (const b of lib.catalog.search('robert')) console.log(`  #${b.id} ${b.title}`);

try {
  lib.catalog.addBook({ author: 'No Title' });
} catch (err) {
  console.log(`\nBad input rejected: ${err.message}`);
}