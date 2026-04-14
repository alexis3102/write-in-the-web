/* ─── Config ────────────────────────────────────── */
const API_BASE = "http://127.0.0.1:8000";

/* ─── Auth guard ────────────────────────────────── */
const USER_ID = parseInt(localStorage.getItem("user_id"));
if (!USER_ID) window.location.href = "../html/login.html";

/* ─── Mostrar nombre en sidebar ─────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("user-display");
  if (nameEl) {
    const raw = localStorage.getItem("user_name") || "";
    nameEl.textContent = raw.replace("Bienvenido ", "").trim() || `#${USER_ID}`;
  }
});

/* ─── Panel metadata ────────────────────────────── */
const PANELS = {
  "write-text":   { title: "Crear texto",         badge: "POST /write/" },
  "search-text":  { title: "Buscar texto",         badge: "POST /search_write/" },
  "create-char":  { title: "Crear personaje",      badge: "POST /chaterest/" },
  "search-char":  { title: "Buscar personaje",     badge: "POST /search_chaterest/" },
  "update-char":  { title: "Actualizar personaje", badge: "PUT /update_chaterest/" },
  "delete-char":  { title: "Eliminar personaje",   badge: "DELETE /delete_chaterest/" },
  "create-place": { title: "Crear lugar",          badge: "POST /place/" },
  "search-place": { title: "Buscar lugar",         badge: "POST /search_place/" },
  "update-place": { title: "Actualizar lugar",     badge: "PUT /update_place/" },
  "delete-place": { title: "Eliminar lugar",       badge: "DELETE /delete_place/" },
};

/* ─── Navigation ────────────────────────────────── */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.panel;
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`panel-${id}`).classList.add("active");
    document.getElementById("panel-title").textContent = PANELS[id].title;
    document.getElementById("endpoint-badge").textContent = PANELS[id].badge;
    closeResponse();
    // Ocultar tarjeta de lugar al cambiar panel
    hidePlaceCard();
  });
});

/* ─── Logout ────────────────────────────────────── */
function logout() {
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  window.location.href = "../html/login.html";
}

/* ─── API helpers ───────────────────────────────── */
function setStatus(state, text) {
  document.getElementById("status-dot").className = "status-dot " + state;
  document.getElementById("status-text").textContent = text;
}

/* JSON normal */
async function call(method, endpoint, body) {
  setStatus("loading", "Enviando…");
  try {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(API_BASE + endpoint, opts);
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

/* Multipart / form-data (para imágenes) */
async function callForm(endpoint, formData) {
  setStatus("loading", "Enviando…");
  try {
    // SIN Content-Type: el navegador pone el boundary correcto
    const res  = await fetch(API_BASE + endpoint, { method: "POST", body: formData });
    const data = await res.json();
    setStatus("ok", "OK " + res.status);
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
  const box  = document.getElementById("response-box");
  const body = document.getElementById("response-body");
  box.style.display = "block";
  body.textContent  = JSON.stringify(data, null, 2);
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
  toast.className   = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ─── Validation ────────────────────────────────── */
function required(val, fieldName) {
  if (!val || !String(val).trim()) {
    showToast(`"${fieldName}" es requerido`, "error");
    return false;
  }
  return true;
}

/* ════════════════════════════════════════════════
   TEXTOS
════════════════════════════════════════════════ */
async function createText() {
  const title = document.getElementById("wt-title").value.trim();
  const text  = document.getElementById("wt-text").value.trim();
  if (!required(title, "Título") || !required(text, "Texto")) return;
  await call("POST", "/write/", { title, text, user_id: USER_ID });
}

async function searchText() {
  const title = document.getElementById("st-title").value.trim();
  if (!required(title, "Título")) return;
  await call("POST", "/search_write/", { title, user_id: USER_ID });
}

/* ════════════════════════════════════════════════
   PERSONAJES
════════════════════════════════════════════════ */
async function createChar() {
  const name      = document.getElementById("cc-name").value.trim();
  const age       = document.getElementById("cc-age").value;
  const personaly = document.getElementById("cc-personaly").value.trim();
  const history   = document.getElementById("cc-history").value.trim();
  if (!required(name,"Nombre")||!required(age,"Edad")||
      !required(personaly,"Personalidad")||!required(history,"Historia")) return;
  await call("POST", "/chaterest/", {
    name, age: parseInt(age), personaly, history, user_id: USER_ID
  });
}

async function searchChar() {
  const name = document.getElementById("sc-name").value.trim();
  if (!required(name, "Nombre")) return;
  await call("POST", "/search_chaterest/", { name, user_id: USER_ID });
}

async function updateChar() {
  const name        = document.getElementById("uc-name").value.trim();
  const new_name    = document.getElementById("uc-new-name").value.trim()     || null;
  const new_age_raw = document.getElementById("uc-new-age").value;
  const new_age     = new_age_raw ? parseInt(new_age_raw)                     : null;
  const new_per     = document.getElementById("uc-new-personaly").value.trim()|| null;
  const new_hist    = document.getElementById("uc-new-history").value.trim()  || null;
  if (!required(name, "Nombre actual")) return;
  const body = { name, user_id: USER_ID };
  if (new_name) body.new_name      = new_name;
  if (new_age)  body.new_age       = new_age;
  if (new_per)  body.new_personaly = new_per;
  if (new_hist) body.new_history   = new_hist;
  await call("PUT", "/update_chaterest/", body);
}

async function deleteChar() {
  const name = document.getElementById("dc-name").value.trim();
  if (!required(name, "Nombre")) return;
  if (!confirm(`¿Eliminar el personaje "${name}"?`)) return;
  await call("DELETE", "/delete_chaterest/", { name, user_id: USER_ID });
}

/* ════════════════════════════════════════════════
   DROPZONE — reutilizable por prefijo de ID
════════════════════════════════════════════════ */

/* Mapa: prefijo → File seleccionado */
const selectedFiles = {};

/* Drag & drop para el dropzone del lugar */
document.addEventListener("DOMContentLoaded", () => {
  initDropzone("cp");   // prefijo del panel "crear lugar"
});

function initDropzone(prefix) {
  const dz = document.getElementById(`${prefix}-dropzone`);
  if (!dz) return;
  dz.addEventListener("dragover", e => {
    e.preventDefault();
    dz.classList.add("drag-over");
  });
  dz.addEventListener("dragleave", () => dz.classList.remove("drag-over"));
  dz.addEventListener("drop", e => {
    e.preventDefault();
    dz.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) applyFile(file, prefix);
  });
}

function handleFileSelect(event, prefix) {
  const file = event.target.files[0];
  if (file) applyFile(file, prefix);
}

function applyFile(file, prefix) {
  const allowed = ["image/jpeg","image/png","image/webp","image/gif"];
  if (!allowed.includes(file.type)) {
    showToast("Formato no permitido. Usa JPG, PNG, WEBP o GIF", "error");
    return;
  }
  selectedFiles[prefix] = file;

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById(`${prefix}-img-preview`).src          = e.target.result;
    document.getElementById(`${prefix}-img-preview`).style.display = "block";
    document.getElementById(`${prefix}-dropzone-inner`).style.display = "none";
    document.getElementById(`${prefix}-clear-btn`).style.display  = "flex";
  };
  reader.readAsDataURL(file);
  showToast(`Imagen lista: ${file.name}`, "success");
}

function clearFile(event, prefix) {
  event.stopPropagation();   // no abre el selector de archivos
  selectedFiles[prefix] = null;
  document.getElementById(`${prefix}-img-preview`).src          = "";
  document.getElementById(`${prefix}-img-preview`).style.display = "none";
  document.getElementById(`${prefix}-dropzone-inner`).style.display = "flex";
  document.getElementById(`${prefix}-clear-btn`).style.display  = "none";
  document.getElementById(`${prefix}-file`).value = "";
}

/* ════════════════════════════════════════════════
   LUGARES — CRUD
════════════════════════════════════════════════ */

/* ── Crear lugar (multipart: datos + imagen juntos) ── */
async function createPlace() {
  const name        = document.getElementById("cp-name").value.trim();
  const danger      = document.getElementById("cp-danger").value;
  const population  = document.getElementById("cp-population").value;
  const resources   = document.getElementById("cp-resources").value.trim();
  const description = document.getElementById("cp-description").value.trim();

  if (!required(name,"Nombre del lugar")||!required(danger,"Peligro")||
      !required(population,"Población")||!required(resources,"Recursos")||
      !required(description,"Descripción")) return;

  const fd = new FormData();
  fd.append("name",        name);
  fd.append("description", description);
  fd.append("danger",      parseInt(danger));
  fd.append("population",  parseInt(population));
  fd.append("resources",   resources);
  fd.append("user_id",     USER_ID);

  /* La imagen es opcional: solo se adjunta si el usuario seleccionó una */
  const img = selectedFiles["cp"];
  if (img) fd.append("image", img);

  const data = await callForm("/place/", fd);
  if (!data) return;

  if (data.status === "ok") {
    showToast(`Lugar "${name}" creado ✦`, "success");
    showResponse(data);
    /* Limpiar formulario */
    ["cp-name","cp-danger","cp-population","cp-resources"].forEach(id =>
      document.getElementById(id).value = "");
    document.getElementById("cp-description").value = "";
    clearFile({ stopPropagation: () => {} }, "cp");
  } else {
    showToast(data.message || "Error al crear el lugar", "error");
    showResponse(data);
  }
}

/* ── Buscar lugar → tarjeta visual con imagen ── */
async function searchPlace() {
  const name = document.getElementById("sp-name").value.trim();
  if (!required(name, "Nombre del lugar")) return;

  setStatus("loading", "Buscando…");
  hidePlaceCard();

  try {
    const res  = await fetch(API_BASE + "/search_place/", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, user_id: USER_ID }),
    });
    const data = await res.json();
    setStatus("ok", "OK " + res.status);

    if (data.status === "error") {
      showToast(data.message, "error");
      setStatus("err", "Error");
      return;
    }

    /* Rellenar tarjeta */
    const d = data.data;
    document.getElementById("place-card-name").textContent       = d.name;
    document.getElementById("place-card-desc").textContent       = d.description;
    document.getElementById("place-card-danger").textContent     = `${d.danger}/10`;
    document.getElementById("place-card-population").textContent = d.population.toLocaleString();
    document.getElementById("place-card-resources").textContent  = d.resources;

    const cardImg   = document.getElementById("place-card-img");
    const cardEmpty = document.getElementById("place-card-img-empty");

    if (d.image_url) {
      cardImg.src          = API_BASE + d.image_url;
      cardImg.style.display  = "block";
      cardEmpty.style.display = "none";
    } else {
      cardImg.style.display  = "none";
      cardEmpty.style.display = "flex";
    }

    /* Mostrar tarjeta con animación */
    const card = document.getElementById("place-card");
    card.style.display = "flex";
    requestAnimationFrame(() => card.classList.add("visible"));
    showToast("Lugar encontrado ✦", "success");

  } catch (err) {
    setStatus("err", "Error");
    showToast("No se pudo conectar con la API", "error");
    console.error(err);
  }
}

function hidePlaceCard() {
  const card = document.getElementById("place-card");
  if (card) {
    card.classList.remove("visible");
    card.style.display = "none";
  }
}

/* ── Actualizar lugar ── */
async function updatePlace() {
  const name           = document.getElementById("up-name").value.trim();
  const name_new       = document.getElementById("up-name-new").value.trim()      || null;
  const danger_raw     = document.getElementById("up-danger-new").value;
  const danger_new     = danger_raw    ? parseInt(danger_raw)                      : null;
  const pop_raw        = document.getElementById("up-population-new").value;
  const population_new = pop_raw       ? parseInt(pop_raw)                         : null;
  const resources_new  = document.getElementById("up-resources-new").value.trim() || null;
  const desc_new       = document.getElementById("up-description-new").value.trim()|| null;

  if (!required(name, "Nombre actual")) return;

  const body = { name, user_id: USER_ID };
  if (name_new)       body.name_new        = name_new;
  if (danger_new)     body.danger_new      = danger_new;
  if (population_new) body.population_new  = population_new;
  if (resources_new)  body.resources_new   = resources_new;
  if (desc_new)       body.description_new = desc_new;

  await call("PUT", "/update_place/", body);
}

/* ── Eliminar lugar ── */
async function deletePlace() {
  const name = document.getElementById("dp-name").value.trim();
  if (!required(name, "Nombre del lugar")) return;
  if (!confirm(`¿Eliminar el lugar "${name}"? Esta acción es irreversible.`)) return;
  await call("DELETE", "/delete_place/", { name, user_id: USER_ID });
}

/* ─── Enter para enviar ─────────────────────────── */
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || e.shiftKey || e.target.tagName === "TEXTAREA") return;
  const active = document.querySelector(".panel.active");
  if (!active) return;
  const btn = active.querySelector(".btn-primary, .btn-danger");
  if (btn) btn.click();
});