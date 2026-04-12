// app/api/data/triage-forms/route.js
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
      .from("triage_forms")
      .select(`
        id,
        status,
        doctor_notes,
        seen_by_doctor_at,
        main_symptom,
        priority,
        alerts,
        diagnoses,
        exams,
        actions,
        notes,
        ta,
        fc,
        spo2,
        temperature,
        created_at,
        patients (
          id,
          full_name,
          age,
          sex,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const normalized = (data || []).map((row) => ({
      id: row.id,
      status: row.status || "en_attente",
      doctor_notes: row.doctor_notes || "",
      seen_by_doctor_at: row.seen_by_doctor_at || null,
      main_symptom: row.main_symptom,
      priority: row.priority || "verte",
      alerts: row.alerts || [],
      diagnoses: row.diagnoses || [],
      exams: row.exams || [],
      actions: row.actions || [],
      notes: row.notes || "",
      ta: row.ta || "",
      fc: row.fc || "",
      spo2: row.spo2 || "",
      temperature: row.temperature || "",
      created_at: row.created_at,
      patient_id: row.patients?.id || "",
      patient_name: row.patients?.full_name || "",
      patient_age: row.patients?.age || "",
      patient_sex: row.patients?.sex || "",
      patient_phone: row.patients?.phone || "",
    }));

    return NextResponse.json({ ok: true, data: normalized });
    
  } catch (error) {
    console.error("GET triage_forms error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la récupération des consultations." },
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
      .from("triage_forms")
      .insert({
        patient_id: body.patient_id,
        main_symptom: body.main_symptom,
        priority: body.priority || "verte",
        ta: body.ta,
        fc: body.fc,
        spo2: body.spo2,
        temperature: body.temperature,
        notes: body.notes,
        created_by: auth.user.name,
        status: "en_attente"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
    
  } catch (error) {
    console.error("POST triage_forms error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la création du formulaire." },
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
    
    // Ajouter les infos de mise à jour par le médecin
    if (auth.user.role === 'medecin') {
      updates.seen_by_doctor_at = new Date().toISOString();
      updates.doctor_name = auth.user.name;
    }
    
    const { data, error } = await supabaseAdmin
      .from("triage_forms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
    
  } catch (error) {
    console.error("PUT triage_forms error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}
