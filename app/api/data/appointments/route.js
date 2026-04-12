// app/api/data/appointments/route.js
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
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, data: data || [] });
    
  } catch (error) {
    console.error("GET appointments error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la récupération des rendez-vous." },
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

    const payload = {
      patient_name: body.patient_name,
      phone: body.phone || null,
      appointment_date: body.appointment_date || null,
      appointment_time: body.appointment_time || null,
      reason: body.reason || null,
      notes: body.notes || null,
      status: body.status || "planifie",
      created_by: auth.user.name,
    };

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
    
  } catch (error) {
    console.error("POST appointments error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la création du rendez-vous." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const auth = verifyAuth(request);
  
  if (auth.error) {
    return NextResponse.json(
      { ok: false, error: auth.error, code: auth.code }, 
      { status: auth.status }
    );
  }

  try {
    const { id, ...updates } = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
    
  } catch (error) {
    console.error("PUT appointments error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const auth = verifyAuth(request);
  
  if (auth.error) {
    return NextResponse.json(
      { ok: false, error: auth.error, code: auth.code }, 
      { status: auth.status }
    );
  }

  try {
    const { id } = await request.json();
    
    const { error } = await supabaseAdmin
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error("DELETE appointments error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
