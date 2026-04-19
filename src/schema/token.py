# ═══════════════════════════════════════════════════════════════
#  token.py  –  Schema de respuesta del token
#  Ubicación sugerida:  src/schema/token.py
# ═══════════════════════════════════════════════════════════════
 
from pydantic import BaseModel
 
class token_schema(BaseModel):
    """
    Lo que el servidor devuelve cuando el login es exitoso.
    El frontend debe guardar 'access_token' (en localStorage o en memoria)
    y enviarlo en cada petición dentro del Header:
        Authorization: Bearer <access_token>
    """
    access_token: str   # El token JWT en sí
    token_type: str     # Siempre "bearer" (estándar OAuth2)
    user_id: int        # Opcional pero útil para el frontend
    role: str           # "user" o "admin"