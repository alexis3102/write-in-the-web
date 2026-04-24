/* ─── Config ────────────────────────────────────── */
const API_BASE = "";

/* ─── Auth guard ─────────────────────────────────── */
// Verificamos AMBAS cosas: que exista el rol admin Y el token JWT
if (localStorage.getItem("admit_role") !== "admin" || !localStorage.getItem("access_token")) {
    window.location.href = "/html/login.html";
}

/* ─── Estado global ──────────────────────────────── */
let allUsers     = [];
let currentView  = "all-users";
let editTargetId = null;

/* ═══════════════════════════════════════════════════
   NAVEGACIÓN
═══════════════════════════════════════════════════ */
const VIEW_META = {
    "all-users":   { title: "Todos los usuarios",  badge: "GET /all_user_admit/" },
    "search-user": { title: "Buscar usuario",       badge: "POST /search_admit/" },
    "edit-user":   { title: "Editar usuario",       badge: "PUT /update_user/" },
    "delete-user": { title: "Eliminar usuario",     badge: "DELETE /dalete_user/" },
};

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const id = btn.dataset.view;
        currentView = id;

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
        document.getElementById(`view-${id}`).classList.add("active");

        document.getElementById("view-title").textContent     = VIEW_META[id].title;
        document.getElementById("endpoint-badge").textContent = VIEW_META[id].badge;

        const refreshBtn = document.getElementById("btn-refresh");
        refreshBtn.style.display = (id === "all-users") ? "flex" : "none";

        if (id === "all-users") loadAllUsers();
    });
});

document.getElementById("btn-refresh").style.display = "flex";

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function setStatus(state, text) {
    document.getElementById("status-dot").className    = "status-dot " + state;
    document.getElementById("status-text").textContent = text;
}

let toastTimer;
function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className   = `toast ${type} show`;
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function required(val, fieldName) {
    if (!val && val !== 0) {
        showToast(`"${fieldName}" es requerido`, "error");
        return false;
    }
    return true;
}

/* ─── apiFetch CON JWT ───────────────────────────────────────
   Único lugar donde se adjunta el token. Si el servidor responde
   401 (token expirado o inválido), se redirige al login.
──────────────────────────────────────────────────────────── */
async function apiFetch(method, endpoint, body) {
    setStatus("loading", "Enviando…");
    try {
        // Leemos el token guardado en el login
        const token = localStorage.getItem("access_token");

        const opts = {
            method,
            headers: {
                "Content-Type": "application/json",
                // Adjuntamos el token en el header estándar de Bearer
                "Authorization": `Bearer ${token}`
            }
        };
        if (body) opts.body = JSON.stringify(body);

        const res  = await fetch(API_BASE + endpoint, opts);

        // Si el servidor dice 401, el token expiró → forzar nuevo login
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

/* ═══════════════════════════════════════════════════
   VIEW: TODOS LOS USUARIOS
═══════════════════════════════════════════════════ */
async function loadAllUsers() {
    const tbody = document.getElementById("users-tbody");
    tbody.innerHTML = `
    <tr class="loading-row">
      <td colspan="5">
        <div class="loading-indicator">
          <span class="loading-spinner">◈</span>
          <span>Cargando usuarios…</span>
        </div>
      </td>
    </tr>`;

    const data = await apiFetch("GET", "/all_user_admit/");
    if (!data || data.status === "error") {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No se encontraron usuarios</td></tr>`;
        document.getElementById("total-count").textContent = "0";
        document.getElementById("table-meta").textContent  = "0 registros";
        return;
    }

    allUsers = data.data || [];
    renderTable(allUsers);
}

function renderTable(users) {
    const tbody = document.getElementById("users-tbody");
    document.getElementById("total-count").textContent = users.length;
    document.getElementById("table-meta").textContent  = `${users.length} registro${users.length !== 1 ? "s" : ""}`;

    if (!users.length) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Sin resultados</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => `
    <tr>
      <td class="td-id">${u.ID}</td>
      <td class="td-name">${escHtml(u.NAME)}</td>
      <td class="td-mail">${escHtml(u.MAIL || "—")}</td>
      <td class="td-pass">${escHtml(u.PASSWORD || "—")}</td>
      <td>
        <div class="td-actions">
          <button class="row-btn edit" onclick="openEditModal(${u.ID}, '${escAttr(u.NAME)}', '${escAttr(u.MAIL || "")}', '${escAttr(u.PASSWORD || "")}')">Editar</button>
          <button class="row-btn del"  onclick="confirmDeleteUser(${u.ID}, '${escAttr(u.NAME)}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function filterTable() {
    const q        = document.getElementById("table-filter").value.toLowerCase().trim();
    const filtered = allUsers.filter(u =>
        String(u.ID).includes(q) ||
        (u.NAME && u.NAME.toLowerCase().includes(q)) ||
        (u.MAIL && u.MAIL.toLowerCase().includes(q))
    );
    renderTable(filtered);
}

function refreshCurrentView() {
    const btn = document.getElementById("btn-refresh");
    btn.classList.add("spinning");
    loadAllUsers().finally(() => {
        setTimeout(() => btn.classList.remove("spinning"), 600);
        showToast("Lista actualizada ✦", "success");
    });
}

/* ═══════════════════════════════════════════════════
   VIEW: BUSCAR USUARIO
═══════════════════════════════════════════════════ */
async function searchUser() {
    const id_raw = document.getElementById("su-id").value.trim();
    const name   = document.getElementById("su-name").value.trim();

    if (!id_raw && !name) {
        showToast("Introduce al menos un campo de búsqueda", "error");
        return;
    }

    const body = {};
    if (id_raw) body.ID   = parseInt(id_raw);
    if (name)   body.NAME = name;

    const data = await apiFetch("POST", "/search_admit/", body);
    if (!data) return;

    if (data.status === "error") {
        showToast(data.message || "Usuario no encontrado", "error");
        document.getElementById("user-card").style.display = "none";
        return;
    }

    const d = data.data;
    document.getElementById("uc-name-display").textContent = d.name     || "—";
    document.getElementById("uc-id-display").textContent   = `ID: ${d.id}`;
    document.getElementById("uc-mail-display").textContent = d.gmail    || "—";
    document.getElementById("uc-pass-display").textContent = d.password || "—";

    window._foundUser = d;

    const card = document.getElementById("user-card");
    card.style.display = "block";
    requestAnimationFrame(() => card.style.opacity = "1");
    showToast("Usuario encontrado ✦", "success");
}

function prefillEdit() {
    const d = window._foundUser;
    if (!d) return;

    document.getElementById("eu-id").value   = d.id;
    document.getElementById("eu-name").value = d.name     || "";
    document.getElementById("eu-mail").value = d.gmail    || "";
    document.getElementById("eu-pass").value = d.password || "";

    document.querySelector('[data-view="edit-user"]').click();
}

/* ═══════════════════════════════════════════════════
   VIEW: EDITAR USUARIO
═══════════════════════════════════════════════════ */
async function editUser() {
    const id_raw = document.getElementById("eu-id").value.trim();
    if (!required(id_raw, "ID del usuario")) return;

    const body = { ID: parseInt(id_raw) };
    const name = document.getElementById("eu-name").value.trim();
    const mail = document.getElementById("eu-mail").value.trim();
    const pass = document.getElementById("eu-pass").value.trim();

    if (name) body.NEW_NAME     = name;
    if (mail) body.NEW_MAIL     = mail;
    if (pass) body.NEW_PASSWORD = pass;

    if (!name && !mail && !pass) {
        showToast("Introduce al menos un campo a actualizar", "error");
        return;
    }

    const data = await apiFetch("PUT", "/update_user/", body);
    if (!data) return;

    if (data.status === "ok") {
        showToast("Usuario actualizado correctamente ✦", "success");
        ["eu-name","eu-mail","eu-pass"].forEach(id => document.getElementById(id).value = "");
        if (allUsers.length) loadAllUsers();
    } else {
        showToast(data.message || "Error al actualizar", "error");
    }
}

/* ═══════════════════════════════════════════════════
   VIEW: ELIMINAR USUARIO
═══════════════════════════════════════════════════ */
async function deleteUser() {
    const id_raw = document.getElementById("du-id").value.trim();
    if (!required(id_raw, "ID del usuario")) return;
    confirmDeleteUser(parseInt(id_raw), `ID ${id_raw}`);
}

function confirmDeleteUser(id, nameLabel) {
    document.getElementById("modal-msg").textContent = `¿Deseas eliminar al usuario "${nameLabel}" (ID: ${id})? Esta acción es permanente.`;
    const confirmBtn = document.getElementById("modal-confirm-btn");

    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener("click", async () => {
        closeModal();
        const data = await apiFetch("DELETE", "/dalete_user/", { ID: id });
        if (!data) return;
        if (data.status === "ok") {
            showToast(`Usuario ID ${id} eliminado ✦`, "success");
            document.getElementById("du-id").value = "";
            if (allUsers.length) loadAllUsers();
        } else {
            showToast(data.message || "Error al eliminar", "error");
        }
    });

    document.getElementById("modal-overlay").style.display = "flex";
}

function closeModal() {
    document.getElementById("modal-overlay").style.display = "none";
}

/* ═══════════════════════════════════════════════════
   MODAL EDICIÓN DESDE TABLA
═══════════════════════════════════════════════════ */
function openEditModal(id, name, mail, pass) {
    editTargetId = id;
    document.getElementById("edit-modal-id").textContent = `#${id}`;
    document.getElementById("em-name").value = "";
    document.getElementById("em-mail").value = "";
    document.getElementById("em-pass").value = "";
    document.getElementById("em-name").placeholder = name || "— sin cambios";
    document.getElementById("em-mail").placeholder = mail || "— sin cambios";
    document.getElementById("em-pass").placeholder = "— sin cambios";
    document.getElementById("edit-modal-overlay").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("edit-modal-overlay").style.display = "none";
    editTargetId = null;
}

async function submitEditModal() {
    if (!editTargetId) return;

    const name = document.getElementById("em-name").value.trim();
    const mail = document.getElementById("em-mail").value.trim();
    const pass = document.getElementById("em-pass").value.trim();

    if (!name && !mail && !pass) {
        showToast("Introduce al menos un campo a actualizar", "error");
        return;
    }

    const body = { ID: editTargetId };
    if (name) body.NEW_NAME     = name;
    if (mail) body.NEW_MAIL     = mail;
    if (pass) body.NEW_PASSWORD = pass;

    const data = await apiFetch("PUT", "/update_user/", body);
    if (!data) return;

    if (data.status === "ok") {
        closeEditModal();
        showToast("Usuario actualizado ✦", "success");
        loadAllUsers();
    } else {
        showToast(data.message || "Error al actualizar", "error");
    }
}

/* ═══════════════════════════════════════════════════
   LOGOUT — limpia TODO el localStorage
═══════════════════════════════════════════════════ */
function logout() {
    // Eliminamos el token y todos los datos de sesión
    localStorage.removeItem("access_token");
    localStorage.removeItem("admit_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    window.location.href = "../html/login.html";
}

/* ═══════════════════════════════════════════════════
   ESCAPE HELPERS (XSS prevention)
═══════════════════════════════════════════════════ */
function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escAttr(str) {
    return String(str)
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
}

/* ═══════════════════════════════════════════════════
   CERRAR MODALES con Escape / Enter para enviar
═══════════════════════════════════════════════════ */
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        closeModal();
        closeEditModal();
    }
    if (e.key === "Enter" && !e.shiftKey) {
        const active = document.querySelector(".view.active");
        if (!active) return;
        const viewId = active.id;
        if (viewId === "view-search-user") searchUser();
        if (viewId === "view-edit-user")   editUser();
        if (viewId === "view-delete-user") deleteUser();
    }
});

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", loadAllUsers);