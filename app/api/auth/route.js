// app/api/auth/route.js - VERSION SANS JWT
import { NextResponse } from 'next/server';

const SECRET = process.env.AUTH_SECRET || 'votre-secret-tres-long-minimum-32-caracteres';

const USERS = {
  assistante: { 
    pin: process.env.ASSISTANTE_PIN || '1234', 
    name: "Assistante", 
    role: "assistante" 
  },
  medecin: { 
    pin: process.env.MEDECIN_PIN || '2026', 
    name: "Dr Hammach Yassine", 
    role: "medecin" 
  }
};

export async function POST(request) {
  try {
    const { role, pin } = await request.json();
    
    if (!role || !pin) {
      return NextResponse.json(
        { error: "Rôle et PIN requis" }, 
        { status: 400 }
      );
    }
    
    const user = USERS[role];
    if (!user || user.pin !== pin) {
      return NextResponse.json(
        { error: "Identifiants invalides" }, 
        { status: 401 }
      );
    }

    // Créer token simple (timestamp:role:name:signature)
    const timestamp = Date.now();
    const signature = await createSignature(timestamp, user.role, user.name);
    const token = `${timestamp}:${user.role}:${user.name}:${signature}`;

    const response = NextResponse.json({ 
      ok: true, 
      user: { role: user.role, name: user.name } 
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 heures
      path: '/'
    });

    return response;
    
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" }, 
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('auth-token');
  return response;
}

export async function GET(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

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

    return NextResponse.json({ 
      ok: true, 
      user: { role, name } 
    });
    
  } catch {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }
}

async function createSignature(timestamp, role, name) {
  const data = `${timestamp}:${role}:${name}:${SECRET}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}
