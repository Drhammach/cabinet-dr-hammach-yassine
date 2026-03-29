// middleware.js - VERSION SANS JWT (plus simple)
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/api/auth'];

// Clé secrète simple (en production, utilisez une vraie variable d'environnement)
const SECRET = process.env.AUTH_SECRET || 'votre-secret-tres-long-minimum-32-caracteres';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Routes publiques (pas d'authentification requise)
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Vérifier le token simple
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: "Non authentifié. Veuillez vous connecter." }, 
      { status: 401 }
    );
  }

  try {
    // Vérification simple du token (format: timestamp:role:name:signature)
    const [timestamp, role, name, signature] = token.split(':');
    
    if (!timestamp || !role || !name || !signature) {
      throw new Error('Token invalide');
    }

    // Vérifier expiration (8 heures)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 8 * 60 * 60 * 1000) {
      throw new Error('Token expiré');
    }

    // Vérifier signature (simple HMAC-like)
    const expectedSignature = await createSignature(timestamp, role, name);
    if (signature !== expectedSignature) {
      throw new Error('Signature invalide');
    }

    // Ajouter infos user aux headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-name', name);
    
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Session invalide ou expirée" }, 
      { status: 401 }
    );
  }
}

// Fonction simple de signature (remplacez par crypto.subtle en production)
async function createSignature(timestamp, role, name) {
  const data = `${timestamp}:${role}:${name}:${SECRET}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Simple hash (pas sécurisé pour la production mais fonctionne sans librairie)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

export const config = {
  matcher: ['/api/:path*']
};
