// lib/auth-helpers.js
export function verifyAuthToken(request) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return { error: "Non authentifié", status: 401, code: "NO_TOKEN" };
  }
  
  const parts = token.split(':');
  if (parts.length !== 4) {
    return { error: "Token invalide", status: 401, code: "INVALID_TOKEN" };
  }
  
  const [timestamp, role, name, signature] = parts;
  
  // Vérifier expiration côté serveur aussi
  const tokenAge = Date.now() - parseInt(timestamp);
  if (tokenAge > 8 * 60 * 60 * 1000) {
    return { error: "Token expiré", status: 401, code: "TOKEN_EXPIRED" };
  }
  
  return { 
    ok: true, 
    user: { role, name: decodeURIComponent(name), timestamp: parseInt(timestamp) },
    token 
  };
}
