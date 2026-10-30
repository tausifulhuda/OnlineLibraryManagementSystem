const test = require('node:test');
const assert = require('node:assert/strict');
const { createLibrary } = require('../src/Library');
const { createApp } = require('../src/app');

async function startServer() {
  const server = createApp(createLibrary());
  await new Promise(resolve => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json() };
  };
  return { server, call };
}

test('full flow through the HTTP API', async () => {
  const { server, call } = await startServer();
  try {
    const book = (await call('POST', '/api/books', { title: 'Clean Code', author: 'Martin', copies: 1 })).data;
    const member = (await call('POST', '/api/members', { name: 'Rafi', type: 'student' })).data;

    const borrow = await call('POST', '/api/loans', { memberId: member.id, bookId: book.id });
    assert.equal(borrow.status, 201);

    const loans = await call('GET', `/api/members/${member.id}/loans`);
    assert.equal(loans.data[0].title, 'Clean Code');

    const second = (await call('POST', '/api/members', { name: 'Nila', type: 'student' })).data;
    assert.equal((await call('POST', '/api/reservations', { memberId: second.id, bookId: book.id })).status, 201);

    await call('POST', `/api/loans/${borrow.data.id}/return`);
    const notes = await call('GET', `/api/members/${second.id}/notifications`);
    assert.equal(notes.data.length, 1);

    const search = await call('GET', '/api/books?q=clean');
    assert.equal(search.data.length, 1);
  } finally {
    server.close();
  }
});

test('errors map to proper status codes', async () => {
  const { server, call } = await startServer();
  try {
    assert.equal((await call('POST', '/api/books', { author: 'No title' })).status, 400);
    assert.equal((await call('POST', '/api/loans', { memberId: 1, bookId: 1 })).status, 404);
    assert.equal((await call('GET', '/api/nothing')).status, 404);
  } finally {
    server.close();
  }
});