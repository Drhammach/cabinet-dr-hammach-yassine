import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const allowed = {
            status: body.status,
            seen_by_doctor_at: body.seen_by_doctor_at,
            doctor_notes: body.doctor_notes,
        };

        const payload = Object.fromEntries(
            Object.entries(allowed).filter(([, v]) => v !== undefined)
        );

        const { data, error } = await supabaseServer
            .from("triage_forms")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ ok: true, data });
    } catch (error) {
        console.error("PATCH triage_forms/[id] error:", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la mise à jour de la consultation." },
            { status: 500 }
        );
    }
}