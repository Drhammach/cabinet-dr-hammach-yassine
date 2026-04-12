// middleware.js - VERSION CORRIGÉE COMPLÈTE
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/api/auth', '/api/health', '/api/test-auth'];
const SECRET = process.env.AUTH_SECRET || 'votre-secret-tres-long-minimum-32-caracteres';

// Fonction IDENTIQUE à celle de auth/route.js
async function createSignature(timestamp, role, name) {
  const data = `${timestamp}:${role}:${name}:${SECRET}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Routes publiques (pas d'authentification requise)
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Récupérer le token du cookie
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    console.log(`[Middleware] ❌ Pas de token pour ${pathname}`);
    return NextResponse.json(
      { error: "Non authentifié", code: "NO_TOKEN" }, 
      { status: 401 }
    );
  }

  try {
    // Parser le token : timestamp:role:name:signature
    const parts = token.split(':');
    if (parts.length !== 4) {
      throw new Error(`Format invalide: ${parts.length} parties au lieu de 4`);
    }
    
    const [timestamp, role, name, signature] = parts;
    
    // Vérifier que toutes les parties existent
    if (!timestamp || !role || !name || !signature) {
      throw new Error('Token incomplet');
    }

    // Vérifier expiration (8 heures)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 8 * 60 * 60 * 1000; // 8 heures en ms
    
    if (tokenAge > maxAge) {
      throw new Error(`Token expiré depuis ${Math.round(tokenAge/1000/60)} minutes`);
    }

    // Vérifier la signature
    const expectedSignature = await createSignature(timestamp, role, name);
    if (signature !== expectedSignature) {
      throw new Error('Signature invalide - AUTH_SECRET différent ?');
    }

    // Succès : ajouter infos utilisateur aux headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-name', name);
    
    console.log(`[Middleware] ✅ OK - ${pathname} | ${role} | ${name}`);
    
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
    
  } catch (error) {
    console.error(`[Middleware] ❌ ${pathname}:`, error.message);
    return NextResponse.json(
      { 
        error: "Session invalide", 
        code: "INVALID_TOKEN",
        detail: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*']
};
