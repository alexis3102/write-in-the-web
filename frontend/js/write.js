const API = 'http://127.0.0.1:8000';

/* ── Tab switching ──────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
  });
});

/* ── Helpers ────────────────────────────────────────── */
function showResponse(id, msg, type = '') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `response-box ${type}`;
}

async function apiFetch(path, method = 'POST', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  return res.json();
}

/* ── WRITE ──────────────────────────────────────────── */
async function createWrite() {
  const title = document.getElementById('write-title').value.trim();
  const text  = document.getElementById('write-text').value.trim();
  if (!title || !text) return showResponse('write-response', '⚠ Completa el título y el contenido.', 'error');
  try {
    const data = await apiFetch('/write/', 'POST', { title, text });
    showResponse('write-response', `✓ Texto "${data.title}" guardado correctamente.`, 'ok');
    document.getElementById('write-title').value = '';
    document.getElementById('write-text').value  = '';
  } catch {
    showResponse('write-response', '✗ Error al conectar con la API.', 'error');
  }
}

async function searchWrite() {
  const title = document.getElementById('search-title').value.trim();
  if (!title) return showResponse('search-response', '⚠ Ingresa un título para buscar.', 'error');
  try {
    const data = await apiFetch('/search_write/', 'POST', { title });
    if (data.status === 'error') {
      showResponse('search-response', `✗ ${data.message}`, 'error');
      document.getElementById('search-result').classList.add('hidden');
    } else {
      showResponse('search-response', '✓ Texto encontrado.', 'ok');
      document.getElementById('result-title-display').textContent = data.data.title;
      document.getElementById('result-text-display').textContent  = data.data.text;
      document.getElementById('search-result').classList.remove('hidden');
    }
  } catch {
    showResponse('search-response', '✗ Error al conectar con la API.', 'error');
  }
}

/* ── CHATEREST ──────────────────────────────────────── */
async function createChaterest() {
  const name     = document.getElementById('ch-name').value.trim();
  const age      = parseInt(document.getElementById('ch-age').value);
  const personaly= document.getElementById('ch-personaly').value.trim();
  const history  = document.getElementById('ch-history').value.trim();
  if (!name || !personaly || !history || isNaN(age))
    return showResponse('ch-create-response', '⚠ Completa todos los campos.', 'error');
  try {
    const data = await apiFetch('/chaterest/', 'POST', { name, age, personaly, history });
    showResponse('ch-create-response', `✓ Personaje "${data.name}" creado.`, 'ok');
    ['ch-name','ch-personaly','ch-history'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('ch-age').value = '';
  } catch {
    showResponse('ch-create-response', '✗ Error al conectar con la API.', 'error');
  }
}

async function searchChaterest() {
  const name = document.getElementById('ch-search-name').value.trim();
  if (!name) return showResponse('ch-search-response', '⚠ Ingresa un nombre.', 'error');
  try {
    const data = await apiFetch('/search_chaterest/', 'POST', { name });
    if (data.status === 'error') {
      showResponse('ch-search-response', `✗ ${data.message}`, 'error');
      document.getElementById('ch-result').classList.add('hidden');
    } else {
      const c = data.data;
      showResponse('ch-search-response', '✓ Personaje encontrado.', 'ok');
      document.getElementById('ch-avatar').textContent     = c.name[0].toUpperCase();
      document.getElementById('ch-res-name').textContent   = c.name;
      document.getElementById('ch-res-age').textContent    = `${c.age} años`;
      document.getElementById('ch-res-personaly').textContent = c.personaly;
      document.getElementById('ch-res-history').textContent   = c.history;
      document.getElementById('ch-result').classList.remove('hidden');
    }
  } catch {
    showResponse('ch-search-response', '✗ Error al conectar con la API.', 'error');
  }
}

async function updateChaterest() {
  const name         = document.getElementById('upd-name').value.trim();
  const new_name     = document.getElementById('upd-new-name').value.trim()    || undefined;
  const new_age_raw  = document.getElementById('upd-new-age').value.trim();
  const new_age      = new_age_raw ? parseInt(new_age_raw) : undefined;
  const new_personaly= document.getElementById('upd-new-personaly').value.trim() || undefined;
  const new_history  = document.getElementById('upd-new-history').value.trim()   || undefined;

  if (!name) return showResponse('upd-response', '⚠ Ingresa el nombre actual.', 'error');

  const body = { name };
  if (new_name)     body.new_name     = new_name;
  if (new_age)      body.new_age      = new_age;
  if (new_personaly)body.new_personaly= new_personaly;
  if (new_history)  body.new_history  = new_history;

  try {
    const data = await apiFetch('/update_chaterest/', 'PUT', body);
    if (data.status === 'error') showResponse('upd-response', `✗ ${data.message}`, 'error');
    else showResponse('upd-response', `✓ ${data.message}`, 'ok');
  } catch {
    showResponse('upd-response', '✗ Error al conectar con la API.', 'error');
  }
}

async function deleteChaterest() {
  const name = document.getElementById('del-name').value.trim();
  if (!name) return showResponse('del-response', '⚠ Ingresa el nombre del personaje.', 'error');
  if (!confirm(`¿Eliminar el personaje "${name}" permanentemente?`)) return;
  try {
    const data = await apiFetch('/delete_chaterest/', 'DELETE', { name });
    if (data.status === 'error') showResponse('del-response', `✗ ${data.message}`, 'error');
    else {
      showResponse('del-response', `✓ ${data.message}`, 'ok');
      document.getElementById('del-name').value = '';
    }
  } catch {
    showResponse('del-response', '✗ Error al conectar con la API.', 'error');
  }
}