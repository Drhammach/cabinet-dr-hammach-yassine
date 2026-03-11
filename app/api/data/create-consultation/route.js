import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

async function findOrCreatePatient(form) {
    const phone = (form.phone || "").trim();
    const fullName = (form.fullName || "").trim();

    if (phone) {
        const { data: existingByPhone } = await supabaseServer
            .from("patients")
            .select("id, full_name, age, sex, phone")
            .eq("phone", phone)
            .limit(1)
            .maybeSingle();

        if (existingByPhone) {
            await supabaseServer
                .from("patients")
                .update({
                    full_name: fullName || existingByPhone.full_name,
                    age: form.age ? Number(form.age) : existingByPhone.age,
                    sex: form.sex || existingByPhone.sex,
                })
                .eq("id", existingByPhone.id);

            return existingByPhone.id;
        }
    }

    if (fullName) {
        const { data: existingByName } = await supabaseServer
            .from("patients")
            .select("id")
            .ilike("full_name", fullName)
            .limit(1)
            .maybeSingle();

        if (existingByName) {
            await supabaseServer
                .from("patients")
                .update({
                    age: form.age ? Number(form.age) : null,
                    sex: form.sex,
                    phone: phone || null,
                })
                .eq("id", existingByName.id);

            return existingByName.id;
        }
    }

    const { data: patient, error } = await supabaseServer
        .from("patients")
        .insert({
            full_name: fullName,
            age: form.age ? Number(form.age) : null,
            sex: form.sex,
            phone: phone || null,
        })
        .select()
        .single();

    if (error) throw error;

    return patient.id;
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { user, form, summary } = body || {};

        const patientId = await findOrCreatePatient(form);

        const { data: triage, error: triageError } = await supabaseServer
            .from("triage_forms")
            .insert({
                patient_id: patientId,

                patient_name: form.fullName || null,
                patient_age: form.age ? Number(form.age) : null,
                patient_sex: form.sex || null,
                patient_phone: form.phone || null,

                created_by: user?.name || "Assistante",

                main_symptom: form.mainSymptom || null,
                onset: form.onset || null,
                duration: form.duration || null,
                pain_scale: form.painScale ? Number(form.painScale) : null,

                ta: form.ta || null,
                fc: form.fc ? Number(form.fc) : null,
                spo2: form.spo2 ? Number(form.spo2) : null,
                temperature: form.temperature ? Number(form.temperature) : null,
                fr: form.fr ? Number(form.fr) : null,
                glycemia: form.glycemia || null,

                associated: form.associated || [],
                risks: form.risks || [],

                notes: form.notes || null,
                doctor_notes: "",
                priority: summary?.priority || "verte",
                alerts: summary?.alerts || [],
                diagnoses: summary?.diagnoses || [],
                exams: summary?.exams || [],
                actions: summary?.actions || [],
                status: "en_attente",
                seen_by_doctor_at: null,
            })
            .select()
            .single();

        if (triageError) throw triageError;

        const { error: waitingError } = await supabaseServer
            .from("waiting_room")
            .insert({
                patient_name: form.fullName || "Patient sans nom",
                phone: form.phone || null,
                reason: form.mainSymptom || null,
                triage_id: triage.id,
                room_status: "present",
            });

        if (waitingError) throw waitingError;

        return NextResponse.json({ ok: true, triageId: triage.id });
    } catch (error) {
        console.error("POST create-consultation error:", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la création de la consultation." },
            { status: 500 }
        );
    }
}