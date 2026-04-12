// app/api/data/patients/route.js
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Client Supabase avec Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

// Helper vérification auth
function verifyAuth(request) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return { error: "Non authentifié", status: 401, code: "NO_TOKEN" };
  }
  
  const parts = token.split(':');
  if (parts.length !== 4) {
    return { error: "Token invalide", status: 401, code: "INVALID_TOKEN" };
  }
  
  return { 
    ok: true, 
    user: { role: parts[1], name: decodeURIComponent(parts[2]) },
    token 
  };
}

export async function GET(request) {
  const auth = verifyAuth(request);
  
  if (auth.error) {
    return NextResponse.json(
      { ok: false, error: auth.error, code: auth.code }, 
      { status: auth.status }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
      ok: true, 
      data: data || [],
      user: auth.user.name // Debug: retourner l'utilisateur connecté
    });
    
  } catch (error) {
    console.error("GET patients error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la récupération des patients." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = verifyAuth(request);
  
  if (auth.error) {
    return NextResponse.json(
      { ok: false, error: auth.error, code: auth.code }, 
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from("patients")
      .insert({
        full_name: body.full_name,
        age: body.age,
        sex: body.sex,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        created_by: auth.user.name
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
    
  } catch (error) {
    console.error("POST patients error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la création du patient." },
      { status: 500 }
    );
  }
}
