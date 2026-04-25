# ✦ Escritorio — El universo que escribes

Plataforma web para escritores creativos que permite gestionar textos, personajes y lugares de sus universos de ficción. Construida con **FastAPI** en el backend y un frontend estático con diseño editorial oscuro.

---

## 🗂 Estructura del proyecto

```
proyecto/
├── main.py                  # Punto de entrada de la API (FastAPI)
├── frontend/
│   ├── index.html           # Landing page pública
│   ├── register.html        # Registro de usuarios
│   ├── html/
│   │   ├── login.html       # Inicio de sesión
│   │   ├── write.html       # Panel principal del escritor
│   │   └── admit.html       # Panel de administración
│   ├── css/
│   │   └── write.css        # Estilos del panel de escritura
│   └── ...
├── src/
│   ├── model/               # Modelos SQLModel (ORM)
│   │   ├── user_mod.py
│   │   ├── text_mod.py
│   │   ├── chaterest_mod.py
│   │   └── place_mod.py
│   ├── schema/              # Schemas de validación (Pydantic)
│   │   ├── user.py
│   │   ├── login.py
│   │   ├── text.py
│   │   ├── chaterest.py
│   │   ├── place.py
│   │   ├── admit.py
│   │   └── token.py
│   ├── sytem/
│   │   └── jwt_auth.py      # Lógica de autenticación JWT
│   ├── img_place/           # Imágenes subidas para los lugares
│   └── ...
└── password.py              # Credenciales del admin (ADMIN_NAME, ADMIN_PASS)
```

---

## 🚀 Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Python · FastAPI · SQLModel |
| Autenticación | JWT (Bearer Token) |
| Base de datos | SQLite (via SQLModel) |
| Frontend | HTML · CSS · JavaScript vanilla |
| Fuentes | Playfair Display · Cormorant Garamond · JetBrains Mono |

---

## ⚙️ Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd escritorio
```

### 2. Crear entorno virtual e instalar dependencias

```bash
python -m venv venv
source venv/bin/activate       # Linux / macOS
venv\Scripts\activate          # Windows

pip install fastapi sqlmodel uvicorn python-jose[cryptography] python-multipart
```

### 3. Configurar credenciales del admin

En el archivo `password.py` define las variables:

```python
ADMIN_NAME = "tu_usuario_admin"
ADMIN_PASS = "tu_contraseña_admin"
```

### 4. Ejecutar el servidor

```bash
uvicorn src.main:app --reload
```

La aplicación estará disponible en `http://localhost:8000`.

---

## 🔐 Autenticación

La API usa **JWT Bearer Token**. El flujo es el siguiente:

1. El cliente hace `POST /login/` con nombre y contraseña.
2. El servidor devuelve un `access_token`.
3. Las rutas protegidas requieren el header: `Authorization: Bearer <token>`.

Existen dos roles:

| Rol | Descripción |
|---|---|
| `user` | Usuario registrado. Accede a sus propios textos, personajes y lugares. |
| `admin` | Acceso total. Definido de forma estática en `password.py`. |

---

## 📡 Endpoints de la API

### Usuarios

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/user/` | Registrar nuevo usuario | No |
| `POST` | `/login/` | Iniciar sesión y obtener JWT | No |
| `GET` | `/me/` | Ver información del usuario actual | ✅ User |

### Textos

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/write/` | Crear un texto | ✅ User |
| `POST` | `/search_write/` | Buscar un texto por título | ✅ User |
| `POST` | `/names_text/` | Listar títulos de textos del usuario | ✅ User |

### Personajes (`chaterest`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/chaterest/` | Crear personaje | ✅ User |
| `POST` | `/search_chaterest/` | Buscar personaje por nombre | ✅ User |
| `POST` | `/names_chaterest/` | Listar nombres de personajes | ✅ User |
| `PUT` | `/update_chaterest/` | Actualizar personaje | ✅ User |
| `DELETE` | `/delete_chaterest/` | Eliminar personaje | ✅ User |

### Lugares (`place`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/place/` | Crear lugar (con imagen opcional) | ✅ User |
| `POST` | `/search_place/` | Buscar lugar por nombre | ✅ User |
| `POST` | `/names_place/` | Listar nombres de lugares | ✅ User |
| `PUT` | `/update_place/` | Actualizar lugar | ✅ User |
| `DELETE` | `/delete_place/` | Eliminar lugar (borra imagen) | ✅ User |

### Administración

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/all_user_admit/` | Listar todos los usuarios | ✅ Admin |
| `POST` | `/search_admit/` | Buscar usuario | ✅ Admin |
| `PUT` | `/updata_admit/` | Actualizar usuario | ✅ Admin |
| `DELETE` | `/delete_admit/` | Eliminar usuario | ✅ Admin |

---

## 🖥 Páginas del frontend

| URL | Descripción |
|---|---|
| `/` | Landing page con presentación de la plataforma |
| `/html/login.html` | Formulario de inicio de sesión |
| `/register.html` | Formulario de registro |
| `/html/write.html` | Panel principal: gestión de textos, personajes y lugares |
| `/html/admit.html` | Panel de administración |

---

## 🗄 Modelos de datos

### Usuario
`ID · NAME · PASSWORD · MAIL`

### Texto
`id · title · content · user_id`

### Personaje (`chaterest`)
`id · name · age · personaly · history · user_id`

### Lugar (`place`)
`id · name · description · danger · population · resources · image_path · user_id`

---

## 📁 Archivos estáticos

- Las imágenes subidas para los lugares se guardan en `src/img_place/` y se sirven bajo la ruta `/images/<nombre_archivo>`.
- El frontend completo se sirve desde la carpeta `frontend/` bajo la ruta `/static`.

---

## 📖 Documentación interactiva

FastAPI genera automáticamente la documentación de la API:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

