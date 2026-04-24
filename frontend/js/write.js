/* ─── Config ────────────────────────────────────── */
const API_BASE = "";

/* ─── Auth guard ────────────────────────────────── */
const USER_ID = parseInt(localStorage.getItem("user_id"));
if (!USER_ID || !localStorage.getItem("access_token")) {
    window.location.href = "/html/login.html";
}

/* ─── Mostrar nombre en sidebar ─────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    const nameEl = document.getElementById("user-display");
    if (nameEl) {
        const raw = localStorage.getItem("user_name") || "";
        nameEl.textContent = raw.replace("Bienvenido ", "").trim() || `#${USER_ID}`;
    }
    initDropzone("cp");

    const editorBody = document.getElementById("wt-text");
    const wordCount  = document.getElementById("wt-wordcount");
    if (editorBody && wordCount) {
        editorBody.addEventListener("input", () => {
            const words = editorBody.value.trim().split(/\s+/).filter(w => w.length > 0).length;
            wordCount.textContent = `${words} ${words === 1 ? "palabra" : "palabras"}`;
        });
    }
});

/* ─── Panel metadata ────────────────────────────── */
const PANELS = {
    "write-text":   { title: "Crear texto",         badge: "POST /write/" },
    "search-text":  { title: "Buscar texto",         badge: "POST /search_write/",    names: "text" },
    "create-char":  { title: "Crear personaje",      badge: "POST /chaterest/" },
    "search-char":  { title: "Buscar personaje",     badge: "POST /search_chaterest/", names: "char" },
    "update-char":  { title: "Actualizar personaje", badge: "PUT /update_chaterest/" },
    "delete-char":  { title: "Eliminar personaje",   badge: "DELETE /delete_chaterest/" },
    "create-place": { title: "Crear lugar",          badge: "POST /place/" },
    "search-place": { title: "Buscar lugar",         badge: "POST /search_place/",    names: "place" },
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
        document.getElementById("panel-title").textContent    = PANELS[id].title;
        document.getElementById("endpoint-badge").textContent = PANELS[id].badge;
        closeResponse();
        hidePlaceCard();
        hideCharCard();
        hideTextResult();

        if (PANELS[id].names) loadNames(PANELS[id].names);
    });
});

/* ─── Logout ────────────────────────────────────── */
function logout() {
    // Limpiamos todo el localStorage al cerrar sesión
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("admit_role");
    window.location.href = "/html/login.html";
}

/* ─── Status ────────────────────────────────────── */
function setStatus(state, text) {
    document.getElementById("status-dot").className   = "status-dot " + state;
    document.getElementById("status-text").textContent = text;
}

/* ─── API helpers CON JWT ───────────────────────────────────────
   call() y callForm() son los únicos lugares donde se hacen
   peticiones a la API. Ambos leen el token del localStorage
   y lo adjuntan en el header Authorization: Bearer <token>.

   Si la API responde 401 → el token expiró → forzamos logout.
────────────────────────────────────────────────────────────── */
async function call(method, endpoint, body) {
    setStatus("loading", "Enviando…");
    try {
        const token = localStorage.getItem("access_token");

        const opts = {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`   // ← JWT aquí
            }
        };
        if (body) opts.body = JSON.stringify(body);

        const res  = await fetch(API_BASE + endpoint, opts);

        // Token expirado o inválido → redirigir al login
        if (res.status === 401) {
            showToast("Sesión expirada. Vuelve a iniciar sesión.", "error");
            logout();
            return null;
        }

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

async function callForm(endpoint, formData) {
    setStatus("loading", "Enviando…");
    try {
        const token = localStorage.getItem("access_token");

        // Para FormData NO ponemos Content-Type (el browser lo pone con el boundary)
        const res  = await fetch(API_BASE + endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`   // ← JWT aquí también
            },
            body: formData
        });

        if (res.status === 401) {
            showToast("Sesión expirada. Vuelve a iniciar sesión.", "error");
            logout();
            return null;
        }

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

/* ════════════════════════════════════════════════════════
   LISTAS LATERALES DE NOMBRES
════════════════════════════════════════════════════════ */
const NAMES_CONFIG = {
    text: {
        endpoint: "/names_text/",
        listId:   "names-list-text",
        inputId:  "st-title",
        onSelect: () => searchText(),
    },
    char: {
        endpoint: "/names_chaterest/",
        listId:   "names-list-char",
        inputId:  "sc-name",
        onSelect: () => searchChar(),
    },
    place: {
        endpoint: "/names_place/",
        listId:   "names-list-place",
        inputId:  "sp-name",
        onSelect: () => searchPlace(),
    },
};

async function loadNames(type) {
    const cfg  = NAMES_CONFIG[type];
    const list = document.getElementById(cfg.listId);
    list.innerHTML = '<p class="names-empty names-loading">↻ Cargando…</p>';

    try {
        const token = localStorage.getItem("access_token");
        const res   = await fetch(API_BASE + cfg.endpoint, {
            method:  "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: USER_ID }),
        });

        if (res.status === 401) { logout(); return; }

        const data = await res.json();

        if (!Array.isArray(data)) {
            list.innerHTML = '<p class="names-empty">Nada aquí todavía.</p>';
            return;
        }
        renderNames(type, data);

    } catch (err) {
        list.innerHTML = '<p class="names-empty names-error">Sin conexión</p>';
        console.error(err);
    }
}

function renderNames(type, names) {
    const cfg  = NAMES_CONFIG[type];
    const list = document.getElementById(cfg.listId);

    if (!names.length) {
        list.innerHTML = '<p class="names-empty">Nada aquí todavía.</p>';
        return;
    }

    list.innerHTML = names.map(name => `
    <button class="name-item" onclick="selectName('${type}', ${JSON.stringify(name)})">
      <span class="name-item-dot">·</span>
      <span class="name-item-text">${name}</span>
    </button>
  `).join("");
}

function selectName(type, name) {
    const cfg   = NAMES_CONFIG[type];
    const input = document.getElementById(cfg.inputId);
    if (!input) return;

    input.value = name;
    document.querySelectorAll(`#names-list-${type} .name-item`).forEach(btn => {
        btn.classList.toggle("active", btn.querySelector(".name-item-text").textContent === name);
    });
    cfg.onSelect();
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

    setStatus("loading", "Buscando…");
    hideTextResult();

    try {
        const token = localStorage.getItem("access_token");
        const res   = await fetch(API_BASE + "/search_write/", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title, user_id: USER_ID }),
        });

        if (res.status === 401) { logout(); return; }

        const data = await res.json();
        setStatus("ok", "OK " + res.status);

        if (data.status === "error") {
            showToast(data.message, "error");
            setStatus("err", "Error");
            return;
        }

        document.getElementById("text-result-title").textContent = data.data.title;
        document.getElementById("text-result-body").textContent  = data.data.text;
        const el = document.getElementById("text-result");
        el.style.display = "block";
        requestAnimationFrame(() => el.classList.add("visible"));
        showToast("Texto encontrado ✦", "success");

    } catch (err) {
        setStatus("err", "Error");
        showToast("No se pudo conectar con la API", "error");
    }
}

function hideTextResult() {
    const el = document.getElementById("text-result");
    if (el) { el.classList.remove("visible"); el.style.display = "none"; }
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

    setStatus("loading", "Buscando…");
    hideCharCard();

    try {
        const token = localStorage.getItem("access_token");
        const res   = await fetch(API_BASE + "/search_chaterest/", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, user_id: USER_ID }),
        });

        if (res.status === 401) { logout(); return; }

        const data = await res.json();
        setStatus("ok", "OK " + res.status);

        if (data.status === "error") {
            showToast(data.message, "error");
            setStatus("err", "Error");
            return;
        }

        const d = data.data;
        document.getElementById("char-card-name").textContent     = d.name;
        document.getElementById("char-card-age").textContent      = `${d.age} años`;
        document.getElementById("char-card-personaly").textContent = d.personaly;
        document.getElementById("char-card-history").textContent  = d.history;

        const card = document.getElementById("char-card");
        card.style.display = "block";
        requestAnimationFrame(() => card.classList.add("visible"));
        showToast("Personaje encontrado ✦", "success");

    } catch (err) {
        setStatus("err", "Error");
        showToast("No se pudo conectar con la API", "error");
    }
}

function hideCharCard() {
    const el = document.getElementById("char-card");
    if (el) { el.classList.remove("visible"); el.style.display = "none"; }
}

async function updateChar() {
    const name     = document.getElementById("uc-name").value.trim();
    const new_name = document.getElementById("uc-new-name").value.trim()      || null;
    const age_raw  = document.getElementById("uc-new-age").value;
    const new_age  = age_raw ? parseInt(age_raw)                               : null;
    const new_per  = document.getElementById("uc-new-personaly").value.trim() || null;
    const new_hist = document.getElementById("uc-new-history").value.trim()   || null;
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
   DROPZONE
════════════════════════════════════════════════ */
const selectedFiles = {};

function initDropzone(prefix) {
    const dz = document.getElementById(`${prefix}-dropzone`);
    if (!dz) return;
    dz.addEventListener("dragover",  e => { e.preventDefault(); dz.classList.add("drag-over"); });
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
        document.getElementById(`${prefix}-img-preview`).src            = e.target.result;
        document.getElementById(`${prefix}-img-preview`).style.display   = "block";
        document.getElementById(`${prefix}-dropzone-inner`).style.display = "none";
        document.getElementById(`${prefix}-clear-btn`).style.display     = "flex";
    };
    reader.readAsDataURL(file);
    showToast(`Imagen lista: ${file.name}`, "success");
}

function clearFile(event, prefix) {
    event.stopPropagation();
    selectedFiles[prefix] = null;
    document.getElementById(`${prefix}-img-preview`).src            = "";
    document.getElementById(`${prefix}-img-preview`).style.display   = "none";
    document.getElementById(`${prefix}-dropzone-inner`).style.display = "flex";
    document.getElementById(`${prefix}-clear-btn`).style.display     = "none";
    document.getElementById(`${prefix}-file`).value = "";
}

/* ════════════════════════════════════════════════
   LUGARES
════════════════════════════════════════════════ */
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
    const img = selectedFiles["cp"];
    if (img) fd.append("image", img);

    const data = await callForm("/place/", fd);
    if (!data) return;

    if (data.status === "ok") {
        showToast(`Lugar "${name}" creado ✦`, "success");
        showResponse(data);
        ["cp-name","cp-danger","cp-population","cp-resources"].forEach(
            id => document.getElementById(id).value = ""
        );
        document.getElementById("cp-description").value = "";
        clearFile({ stopPropagation: () => {} }, "cp");
    } else {
        showToast(data.message || "Error al crear el lugar", "error");
        showResponse(data);
    }
}

async function searchPlace() {
    const name = document.getElementById("sp-name").value.trim();
    if (!required(name, "Nombre del lugar")) return;

    setStatus("loading", "Buscando…");
    hidePlaceCard();

    try {
        const token = localStorage.getItem("access_token");
        const res   = await fetch(API_BASE + "/search_place/", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, user_id: USER_ID }),
        });

        if (res.status === 401) { logout(); return; }

        const data = await res.json();
        setStatus("ok", "OK " + res.status);

        if (data.status === "error") {
            showToast(data.message, "error");
            setStatus("err", "Error");
            return;
        }

        const d = data.data;
        document.getElementById("place-card-name").textContent       = d.name;
        document.getElementById("place-card-desc").textContent       = d.description;
        document.getElementById("place-card-danger").textContent     = `${d.danger}/10`;
        document.getElementById("place-card-population").textContent = d.population.toLocaleString();
        document.getElementById("place-card-resources").textContent  = d.resources;

        const cardImg   = document.getElementById("place-card-img");
        const cardEmpty = document.getElementById("place-card-img-empty");
        if (d.image_url) {
            cardImg.src            = API_BASE + d.image_url;
            cardImg.style.display   = "block";
            cardEmpty.style.display = "none";
        } else {
            cardImg.style.display   = "none";
            cardEmpty.style.display = "flex";
        }

        const card = document.getElementById("place-card");
        card.style.display = "flex";
        requestAnimationFrame(() => card.classList.add("visible"));
        showToast("Lugar encontrado ✦", "success");

    } catch (err) {
        setStatus("err", "Error");
        showToast("No se pudo conectar con la API", "error");
    }
}

function hidePlaceCard() {
    const el = document.getElementById("place-card");
    if (el) { el.classList.remove("visible"); el.style.display = "none"; }
}

async function updatePlace() {
    const name       = document.getElementById("up-name").value.trim();
    const name_new   = document.getElementById("up-name-new").value.trim()        || null;
    const danger_raw = document.getElementById("up-danger-new").value;
    const danger_new = danger_raw ? parseInt(danger_raw)                           : null;
    const pop_raw    = document.getElementById("up-population-new").value;
    const pop_new    = pop_raw    ? parseInt(pop_raw)                              : null;
    const res_new    = document.getElementById("up-resources-new").value.trim()   || null;
    const desc_new   = document.getElementById("up-description-new").value.trim() || null;
    if (!required(name, "Nombre actual")) return;
    const body = { name, user_id: USER_ID };
    if (name_new)   body.name_new        = name_new;
    if (danger_new) body.danger_new      = danger_new;
    if (pop_new)    body.population_new  = pop_new;
    if (res_new)    body.resources_new   = res_new;
    if (desc_new)   body.description_new = desc_new;
    await call("PUT", "/update_place/", body);
}

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