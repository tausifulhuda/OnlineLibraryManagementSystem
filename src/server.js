const path = require('node:path');
const { createLibrary } = require('./Library');
const { createApp } = require('./app');

const library = createLibrary({ dataDir: path.join(__dirname, '..', 'data') });
const PORT = process.env.PORT || 3000;

createApp(library).listen(PORT, () => {
  console.log(`Library system running at http://localhost:${PORT}`);
});