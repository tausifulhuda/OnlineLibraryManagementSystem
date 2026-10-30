const $ = id => document.getElementById(id);
const me = () => Number($('who').value) || null;

const esc = text => String(text).replace(/[&<>"]/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[char]));

/* ---------- Talking to the server ---------- */

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

function say(text, ok = true) {
  const box = $('msg');
  box.textContent = text;
  box.className = ok ? 'ok' : 'err';
}

/** Runs an action, shows a success or error message, then redraws the page. */
async function run(action, success) {
  try {
    await action();
    if (success) say(success);
  } catch (err) {
    say(err.message, false);
  }
  await refresh();
}

/* ---------- Drawing the page ---------- */

async function loadMembers() {
  const members = await api('GET', '/api/members');
  const current = $('who').value;

  $('who').innerHTML =
    '<option value="">Choose a member</option>' +
    members.map(m => `<option value="${m.id}">${esc(m.name)} (${m.type})</option>`).join('');
  $('who').value = current;
}

async function loadBooks() {
  const books = await api('GET', '/api/books?q=' + encodeURIComponent($('q').value));

  if (!books.length) {
    $('books').innerHTML = '<p class="muted">No books yet. Add one below.</p>';
    return;
  }

  $('books').innerHTML = books.map(book => `
    <div class="book ${book.available ? '' : 'out'}">
      <div class="info">
        <strong>${esc(book.title)}</strong><br>
        <small>${esc(book.author)} · ${book.available} of ${book.copies} available</small>
      </div>
      ${book.available
        ? `<button data-borrow="${book.id}">Borrow</button>`
        : `<button class="plain" data-reserve="${book.id}">Reserve</button>`}
      <button class="plain" data-remove="${book.id}" aria-label="Remove ${esc(book.title)}">Remove</button>
    </div>`).join('');
}

async function loadMine() {
  if (!me()) {
    $('loans').textContent = 'Pick a member above.';
    $('notes').textContent = 'Pick a member above.';
    return;
  }

  const [loans, notes] = await Promise.all([
    api('GET', `/api/members/${me()}/loans`),
    api('GET', `/api/members/${me()}/notifications`),
  ]);

  $('loans').innerHTML = loans.length
    ? loans.map(loan => `
        <div class="row loan">
          <div>
            <strong>${esc(loan.title)}</strong><br>
            <small class="${loan.daysLate ? 'late' : 'muted'}">
              ${loan.daysLate
                ? `${loan.daysLate} days late, fine ${loan.estimatedFine}`
                : 'Due ' + new Date(loan.dueAt).toLocaleDateString()}
            </small>
          </div>
          <button class="plain" data-return="${loan.id}">Return</button>
        </div>`).join('')
    : '<span class="muted">No books borrowed.</span>';

  $('notes').innerHTML = notes.length
    ? '<ul>' + notes.map(note => `<li>${esc(note.message)}</li>`).join('') + '</ul>'
    : '<span class="muted">Nothing new.</span>';
}

const refresh = () => Promise.all([loadBooks(), loadMine()]);

/* ---------- Button clicks ---------- */

document.addEventListener('click', event => {
  const data = event.target.dataset;

  if (data.borrow) {
    if (!me()) return say('Choose a member first', false);
    run(() => api('POST', '/api/loans', { memberId: me(), bookId: Number(data.borrow) }), 'Book borrowed');
  }

  if (data.reserve) {
    if (!me()) return say('Choose a member first', false);
    run(
      () => api('POST', '/api/reservations', { memberId: me(), bookId: Number(data.reserve) }),
      'Reserved. You will be notified when it is returned'
    );
  }

  if (data.return) {
    run(() => api('POST', `/api/loans/${data.return}/return`), 'Book returned');
  }

  if (data.remove) {
    run(() => api('DELETE', `/api/books/${data.remove}`), 'Book removed');
  }
});

$('searchBtn').onclick = loadBooks;
$('q').onkeydown = event => { if (event.key === 'Enter') loadBooks(); };
$('who').onchange = loadMine;

$('addBook').onclick = () => run(async () => {
  await api('POST', '/api/books', {
    title: $('bTitle').value,
    author: $('bAuthor').value,
    copies: Number($('bCopies').value),
  });
  $('bTitle').value = '';
  $('bAuthor').value = '';
}, 'Book added');

$('addMember').onclick = () => run(async () => {
  await api('POST', '/api/members', { name: $('mName').value, type: $('mType').value });
  $('mName').value = '';
  await loadMembers();
}, 'Member added');

/* ---------- Start ---------- */

loadMembers().then(refresh);