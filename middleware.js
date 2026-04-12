// middleware.js - VERSION FINALE CORRIGÉE
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/health',
  '/api/test-auth',
  '/_next',
  '/favicon.ico',
  '/login',
  '/debug'
];

const SECRET = process.env.AUTH_SECRET || 'votre-secret-tres-long-minimum-32-caracteres';

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
  
  // Routes publiques - pas d'authentification
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route) || pathname === route)) {
    return NextResponse.next();
  }

  // Vérifier si c'est une route API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Récupérer le token
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    console.log(`[Middleware] ❌ 401 NO_TOKEN for ${pathname}`);
    return NextResponse.json(
      { error: "Non authentifié", code: "NO_TOKEN", path: pathname }, 
      { status: 401 }
    );
  }

  try {
    const parts = token.split(':');
    if (parts.length !== 4) {
      throw new Error(`Format invalide: ${parts.length} parties`);
    }
    
    const [timestamp, role, name, signature] = parts;
    
    if (!timestamp || !role || !name || !signature) {
      throw new Error('Token incomplet');
    }

    // Vérifier expiration (8 heures)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 8 * 60 * 60 * 1000;
    
    if (tokenAge > maxAge) {
      throw new Error(`Token expiré`);
    }

    // Vérifier signature
    const expectedSignature = await createSignature(timestamp, role, name);
    if (signature !== expectedSignature) {
      console.log(`[Middleware] ❌ Signature mismatch`);
      console.log(`  Attendu: ${expectedSignature}`);
      console.log(`  Reçu: ${signature}`);
      throw new Error('Signature invalide');
    }

    // Succès - ajouter headers pour les routes API
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-name', decodeURIComponent(name));
    requestHeaders.set('x-auth-verified', 'true');
    
    console.log(`[Middleware] ✅ OK ${pathname} | ${role}`);

    return NextResponse.next({
      request: { headers: requestHeaders }
    });
    
  } catch (error) {
    console.error(`[Middleware] ❌ 401 INVALID_TOKEN for ${pathname}:`, error.message);
    return NextResponse.json(
      { 
        error: "Session invalide ou expirée", 
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
