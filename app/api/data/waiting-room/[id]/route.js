import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const { data, error } = await supabaseServer
            .from("waiting_room")
            .update({ room_status: body.room_status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ ok: true, data });
    } catch (error) {
        console.error("PATCH waiting_room/[id] error:", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la mise à jour de la salle d'attente." },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        const { error } = await supabaseServer
            .from("waiting_room")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("DELETE waiting_room/[id] error:", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la suppression du patient de la salle d'attente." },
            { status: 500 }
        );
    }
}