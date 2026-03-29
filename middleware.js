// middleware.js - CORRIGÉ
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/api/auth'];
const SECRET = process.env.AUTH_SECRET || 'votre-secret-tres-long-minimum-32-caracteres';

// Fonction de signature (doit être identique à celle de auth.js)
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
  
  // Routes publiques
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Récupérer le token du cookie
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    console.log(`[Middleware] No token for ${pathname}`); // Debug
    return NextResponse.json(
      { error: "Non authentifié. Veuillez vous connecter." }, 
      { status: 401 }
    );
  }

  try {
    const [timestamp, role, name, signature] = token.split(':');
    
    if (!timestamp || !role || !name || !signature) {
      throw new Error('Token invalide');
    }

    // Vérifier expiration
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 8 * 60 * 60 * 1000) {
      throw new Error('Token expiré');
    }

    // Vérifier signature
    const expectedSignature = await createSignature(timestamp, role, name);
    if (signature !== expectedSignature) {
      throw new Error('Signature invalide');
    }

    // Ajouter les infos utilisateur aux headers pour les routes API
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-name', name);
    
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
    
  } catch (error) {
    console.log(`[Middleware] Invalid token for ${pathname}:`, error.message); // Debug
    return NextResponse.json(
      { error: "Session invalide ou expirée" }, 
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*']
};
