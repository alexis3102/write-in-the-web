/* ─── Config ────────────────────────────────────── */
const API_BASE = "http://127.0.0.1:8000";

/* ─── Panel metadata ────────────────────────────── */
const PANELS = {
  "write-text":   { title: "Crear texto",         badge: "POST /write/" },
  "search-text":  { title: "Buscar texto",         badge: "POST /search_write/" },
  "create-char":  { title: "Crear personaje",      badge: "POST /chaterest/" },
  "search-char":  { title: "Buscar personaje",     badge: "POST /search_chaterest/" },
  "update-char":  { title: "Actualizar personaje", badge: "PUT /update_chaterest/" },
  "delete-char":  { title: "Eliminar personaje",   badge: "DELETE /delete_chaterest/" },
};

/* ─── Navigation ────────────────────────────────── */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.panel;

    // Update active button
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Update active panel
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`panel-${id}`).classList.add("active");

    // Update topbar
    document.getElementById("panel-title").textContent = PANELS[id].title;
    document.getElementById("endpoint-badge").textContent = PANELS[id].badge;

    // Hide response
    closeResponse();
  });
});

/* ─── API helpers ───────────────────────────────── */
function setStatus(state, text) {
  const dot = document.getElementById("status-dot");
  const txt = document.getElementById("status-text");
  dot.className = "status-dot " + state;
  txt.textContent = text;
}

async function call(method, endpoint, body) {
  setStatus("loading", "Enviando…");
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + endpoint, opts);
    const data = await res.json();
    setStatus("ok", "OK " + res.status);
    showResponse(data);
    return data;
  } catch (err) {
    setStatus("err", "Error");
    showToast("No se pudo conectar con la API", "error");
    console.error(err);
    return null;
  }
}

/* ─── Response display ──────────────────────────── */
function showResponse(data) {
  const box = document.getElementById("response-box");
  const body = document.getElementById("response-body");
  box.style.display = "block";

  // Pretty JSON with color hints (applied as text, not innerHTML for safety)
  const pretty = JSON.stringify(data, null, 2);
  body.textContent = pretty;

  // Determine toast based on status field
  if (data?.status === "ok" || data?.id !== undefined) {
    showToast("Operación exitosa ✦", "success");
  } else if (data?.status === "error") {
    showToast(data.message || "Error en la operación", "error");
    setStatus("err", "Error");
  } else {
    showToast("Respuesta recibida", "success");
  }
}

function closeResponse() {
  document.getElementById("response-box").style.display = "none";
}

/* ─── Toast ─────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ─── Validation helper ─────────────────────────── */
function required(val, fieldName) {
  if (!val || !String(val).trim()) {
    showToast(`"${fieldName}" es requerido`, "error");
    return false;
  }
  return true;
}

/* ─── Endpoint functions ────────────────────────── */

// POST /write/
async function createText() {
  const title = document.getElementById("wt-title").value.trim();
  const text  = document.getElementById("wt-text").value.trim();
  if (!required(title, "Título") || !required(text, "Texto")) return;
  await call("POST", "/write/", { title, text });
}

// POST /search_write/
async function searchText() {
  const title = document.getElementById("st-title").value.trim();
  if (!required(title, "Título")) return;
  await call("POST", "/search_write/", { title });
}

// POST /chaterest/
async function createChar() {
  const name     = document.getElementById("cc-name").value.trim();
  const age      = document.getElementById("cc-age").value;
  const personaly= document.getElementById("cc-personaly").value.trim();
  const history  = document.getElementById("cc-history").value.trim();
  if (!required(name, "Nombre") || !required(age, "Edad") ||
      !required(personaly, "Personalidad") || !required(history, "Historia")) return;
  await call("POST", "/chaterest/", { name, age: parseInt(age), personaly, history });
}

// POST /search_chaterest/
async function searchChar() {
  const name = document.getElementById("sc-name").value.trim();
  if (!required(name, "Nombre")) return;
  await call("POST", "/search_chaterest/", { name });
}

// PUT /update_chaterest/
async function updateChar() {
  const name        = document.getElementById("uc-name").value.trim();
  const new_name    = document.getElementById("uc-new-name").value.trim() || null;
  const new_age_raw = document.getElementById("uc-new-age").value;
  const new_age     = new_age_raw ? parseInt(new_age_raw) : null;
  const new_personaly = document.getElementById("uc-new-personaly").value.trim() || null;
  const new_history   = document.getElementById("uc-new-history").value.trim() || null;

  if (!required(name, "Nombre actual")) return;

  const body = { name };
  if (new_name)     body.new_name     = new_name;
  if (new_age)      body.new_age      = new_age;
  if (new_personaly)body.new_personaly= new_personaly;
  if (new_history)  body.new_history  = new_history;

  await call("PUT", "/update_chaterest/", body);
}

// DELETE /delete_chaterest/
async function deleteChar() {
  const name = document.getElementById("dc-name").value.trim();
  if (!required(name, "Nombre")) return;

  const confirmed = window.confirm(`¿Eliminar el personaje "${name}"? Esta acción es irreversible.`);
  if (!confirmed) return;

  await call("DELETE", "/delete_chaterest/", { name });
}

/* ─── Keyboard shortcut: Enter to submit ────────── */
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || e.shiftKey || e.target.tagName === "TEXTAREA") return;

  const active = document.querySelector(".panel.active");
  if (!active) return;

  const btn = active.querySelector(".btn-primary, .btn-danger");
  if (btn) btn.click();
});