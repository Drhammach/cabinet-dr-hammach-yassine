// app/api/auth/route.js - VERSION CORRIGÉE
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-par-defaut-tres-long-32-caracteres-min'
);

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

    const token = await new SignJWT({ 
      role: user.role, 
      name: user.name,
      iat: Date.now() 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET);

    const response = NextResponse.json({ 
      ok: true, 
      user: { role: user.role, name: user.name } 
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
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

    const { payload } = await jwtVerify(token, SECRET);
    
    return NextResponse.json({ 
      ok: true, 
      user: { role: payload.role, name: payload.name } 
    });
    
  } catch {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }
}
