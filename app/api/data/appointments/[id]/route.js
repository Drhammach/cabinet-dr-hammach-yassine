import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const allowed = {
            patient_name: body.patient_name,
            phone: body.phone,
            appointment_date: body.appointment_date,
            appointment_time: body.appointment_time,
            reason: body.reason,
            notes: body.notes,
            status: body.status,
        };

        const payload = Object.fromEntries(
            Object.entries(allowed).filter(([, v]) => v !== undefined)
        );

        const { data, error } = await supabaseServer
            .from("appointments")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ ok: true, data });
    } catch (error) {
        console.error("PATCH appointments/[id] error:", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la mise à jour du rendez-vous." },
            { status: 500 }
        );
    }
}