import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        console.log("TEST - Body reçu:", JSON.stringify(body, null, 2));

        const { patient, consultation } = body;

        if (!patient || !consultation) {
            return NextResponse.json(
                { error: "Données manquantes", received: body },
                { status: 400 }
            );
        }

        // Réponse de test SANS OpenAI
        return NextResponse.json({
            ok: true,
            data: {
                resume_clinique: `TEST - Patient ${patient.sexe} de ${patient.age} ans`,
                diagnostics_probables: [
                    "Test diagnostic 1 (score: 80)",
                    "Test diagnostic 2 (score: 60)",
                    "Test diagnostic 3 (score: 40)"
                ],
                diagnostics_graves_a_eliminer: ["Test gravité"],
                red_flags: ["Test red flag"],
                bilans_recommandes: ["Test bilan"],
                conduite_a_tenir: ["Test conduite"],
                propositions_therapeutiques: ["Test traitement"],
                questions_utiles: ["Test question"],
                niveau_urgence: "verte",
                avertissement: "TEST - Mode sans OpenAI"
            },
            test: true
        });

    } catch (error) {
        console.error("TEST ERROR:", error);
        return NextResponse.json(
            { error: "Erreur test", details: error.message },
            { status: 500 }
        );
    }
}
