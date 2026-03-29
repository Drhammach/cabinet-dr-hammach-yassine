import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-tres-long-et-complexe-minimum-32-caracteres'
);

const PUBLIC_ROUTES = ['/api/auth'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: "Non authentifié. Veuillez vous connecter." }, 
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.name);
    
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

export const config = {
  matcher: ['/api/:path*']
};
