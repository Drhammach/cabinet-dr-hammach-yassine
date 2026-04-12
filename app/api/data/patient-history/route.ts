// app/api/data/patient-history/route.ts
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

function verifyAuth(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
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

export async function GET(request: Request) {
  const auth = verifyAuth(request);
  
  if (auth.error) {
    return NextResponse.json(
      { ok: false, error: auth.error, code: auth.code }, 
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status') || 'all';

    let query = supabaseAdmin
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
          phone,
          email,
          address
        )
      `)
      .order("created_at", { ascending: false });

    if (patientId && patientId !== 'all') {
      query = query.eq("patient_id", patientId);
    }
    
    if (from) {
      query = query.gte("created_at", `${from}T00:00:00`);
    }
    
    if (to) {
      query = query.lte("created_at", `${to}T23:59:59`);
    }

    if (status !== 'all') {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(500);
    if (error) throw error;

    // Enrichir les données
    const enrichedData = (data || []).map((record: any) => ({
      ...record,
      patient_age: record.patients?.age || null,
      resume_clinique: [
        record.ta ? `TA ${record.ta}` : null,
        record.temperature ? `${record.temperature}°C` : null,
        record.fc ? `FC ${record.fc}` : null
      ].filter(Boolean).join(' | ') || 'Pas de constantes'
    }));

    return NextResponse.json({ 
      ok: true, 
      data: enrichedData,
      count: enrichedData.length,
      filters: { patientId, from, to, status }
    });

  } catch (error: any) {
    console.error("GET patient-history error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur", detail: error.message },
      { status: 500 }
    );
  }
}
