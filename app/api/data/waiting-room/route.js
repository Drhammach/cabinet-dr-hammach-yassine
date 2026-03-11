import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
    try {
        const { data, error } = await supabaseServer
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