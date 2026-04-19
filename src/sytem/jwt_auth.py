# ═══════════════════════════════════════════════════════════════
#  jwt_auth.py  –  Utilidades JWT para tu proyecto
#  Ubicación sugerida:  src/sytem/jwt_auth.py
# ═══════════════════════════════════════════════════════════════
#
#  ¿Qué es un JWT?
#  JSON Web Token es una cadena con 3 partes separadas por puntos:
#
#    HEADER.PAYLOAD.SIGNATURE
#
#    • HEADER   → tipo de token y algoritmo usado (HS256)
#    • PAYLOAD  → datos que queremos guardar (user_id, rol, expiración)
#    • SIGNATURE→ firma digital que garantiza que nadie lo alteró
#
#  El servidor NUNCA guarda el token; solo lo verifica con la firma.
# ═══════════════════════════════════════════════════════════════

from datetime import datetime, timedelta
from typing import Optional

# python-jose es la librería que genera y valida JWTs
# Instala con:  pip install python-jose[cryptography]
from jose import JWTError, jwt

# ── Configuración ─────────────────────────────────────────────
# SECRET_KEY: clave secreta con la que se FIRMA el token.
#   → Si alguien la conoce puede crear tokens falsos. ¡Guárdala bien!
#   → En producción usa una variable de entorno, nunca la hardcodees.
SECRET_KEY = "cambia-esto-por-algo-muy-secreto-123"

# ALGORITHM: algoritmo de firma. HS256 = HMAC + SHA-256, el más común.
ALGORITHM = "HS256"

# Tiempo de vida del token (en minutos).
# Después de este tiempo el token expira y el usuario debe volver a loguearse.
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hora


# ── Función 1: CREAR el token ─────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Recibe un diccionario con los datos que quieres guardar en el token
    y devuelve el token JWT como string.

    Ejemplo de uso:
        token = create_access_token({"sub": str(user.ID), "role": "user"})
    """
    # Copiamos el dict para no modificar el original
    to_encode = data.copy()

    # Calculamos cuándo expira
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # "exp" es una clave estándar de JWT que indica la expiración
    to_encode.update({"exp": expire})

    # jwt.encode() firma el payload y devuelve el token como string
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ── Función 2: VERIFICAR / DECODIFICAR el token ───────────────
def verify_token(token: str) -> Optional[dict]:
    """
    Recibe un token JWT y devuelve el payload (dict) si es válido.
    Si el token es inválido o expiró, devuelve None.

    Ejemplo de uso:
        payload = verify_token(token)
        if payload is None:
            # token inválido → rechazar la petición
    """
    try:
        # jwt.decode() verifica la firma Y la expiración automáticamente
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # JWTError cubre: firma inválida, token expirado, formato roto
        return None


# ── Función 3: Extraer el user_id del token ───────────────────
def get_user_id_from_token(token: str) -> Optional[int]:
    """
    Atajo rápido para obtener el ID del usuario desde el token.
    Devuelve None si el token no es válido.
    """
    payload = verify_token(token)
    if payload is None:
        return None
    # "sub" (subject) es la clave estándar donde guardamos el ID del usuario
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return int(user_id)


# ── Función 4: Saber si es admin ──────────────────────────────
def is_admin_token(token: str) -> bool:
    """
    Devuelve True si el token tiene rol de administrador.
    """
    payload = verify_token(token)
    if payload is None:
        return False
    return payload.get("role") == "admin"