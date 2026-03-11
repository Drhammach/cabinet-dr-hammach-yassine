import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const payload = {
            full_name: body.full_name,
            age: body.age,
            sex: body.sex,
            phone: body.phone,
            clinical_notes: body.clinical_notes,
            labs: body.labs,
        };

        const { data, error } = await supabaseServer
            .from("patients")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ ok: true, data });
    } catch (error) {
        console.error("PATCH patients/[id] error:", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la mise à jour du patient." },
            { status: 500 }
        );
    }
}