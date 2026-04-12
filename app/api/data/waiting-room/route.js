// app/api/data/waiting-room/route.js
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

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
    user: { role: parts[1], name: decodeURIComponent(parts[2]) }
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
      .from("waiting_room")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, data: data || [] });
    
  } catch (error) {
    console.error("GET waiting_room error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la récupération de la salle d'attente." },
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
      .from("waiting_room")
      .insert({
        patient_name: body.patient_name,
        reason: body.reason,
        priority: body.priority || "normal",
        status: "en_attente",
        created_by: auth.user.name
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
    
  } catch (error) {
    console.error("POST waiting_room error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de l'ajout à la salle d'attente." },
      { status: 500 }
    );
  }
}
