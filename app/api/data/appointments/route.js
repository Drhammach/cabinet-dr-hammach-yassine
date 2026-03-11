import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
    try {
        const { data, error } = await supabaseServer
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

export async function POST(req) {
    try {
        const body = await req.json();

        const payload = {
            patient_name: body.patient_name,
            phone: body.phone || null,
            appointment_date: body.appointment_date || null,
            appointment_time: body.appointment_time || null,
            reason: body.reason || null,
            notes: body.notes || null,
            status: body.status || "planifie",
            created_by: body.created_by || null,
        };

        const { data, error } = await supabaseServer
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