import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
    try {
        const { data, error } = await supabaseServer
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