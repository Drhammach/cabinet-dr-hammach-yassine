import { NextResponse } from "next/server";

// Fallback sans OpenAI - fonctionne immédiatement
export async function POST(req) {
    try {
        const body = await req.json();
        const { patient, consultation, notes } = body;

        if (!patient || !consultation) {
            return NextResponse.json(
                { error: "Données manquantes: patient et consultation requis" },
                { status: 400 }
            );
        }

        const age = parseInt(patient.age) || 0;
        const sexe = patient.sexe || "non précisé";
        const motif = consultation.motif || "non précisé";

        // Réponse intelligente basée sur les données (sans OpenAI)
        const getDiagnostics = (motif) => {
            const map = {
                "Douleur thoracique": [
                    { label: "Douleur pariétale thoracique", score: 68 },
                    { label: "Reflux gastro-œsophagien", score: 46 },
                    { label: "Anxiété", score: 35 }
                ],
                "Dyspnée": [
                    { label: "Asthme / bronchospasme", score: 60 },
                    { label: "Pneumonie", score: 45 },
                    { label: "Embolie pulmonaire", score: 40 }
                ],
                "Douleur abdominale": [
                    { label: "Gastro-entérite", score: 55 },
                    { label: "Gastrite / ulcère", score: 50 },
                    { label: "Colopathie fonctionnelle", score: 35 }
                ],
                "Céphalée": [
                    { label: "Migraine", score: 60 },
                    { label: "Céphalée de tension", score: 55 },
                    { label: "Sinusite", score: 35 }
                ]
            };
            return map[motif] || [
                { label: "Diagnostic à préciser par examen clinique", score: 50 },
                { label: "Étiologie fonctionnelle possible", score: 30 },
                { label: "Surveillance recommandée", score: 20 }
            ];
        };

        const diagnostics = getDiagnostics(motif);

        const result = {
            resume_clinique: `Patient ${sexe} de ${age} ans présentant ${motif}.`,
            diagnostics_probables: diagnostics.map(d => `${d.label} (score: ${d.score})`),
            diagnostics_graves_a_eliminer: ["Syndrome coronarien aigu", "Embolie pulmonaire", "Dissection aortique"].slice(0, 2),
            red_flags: ["Douleur intense persistante", "Signes de choc", "Détresse respiratoire"],
            bilans_recommandes: ["ECG", "Bilan biologique standard", "Imagerie si indication"],
            conduite_a_tenir: [
                "Évaluation clinique complète",
                "Éliminer les diagnostics graves",
                "Adapter le bilan au contexte"
            ],
            propositions_therapeutiques: [
                "Traitement symptomatique adapté",
                "Réévaluation selon évolution",
                "Orientation spécialisée si nécessaire"
            ],
            questions_utiles: [
                "Antécédents cardiovasculaires ?",
                "Traitement en cours ?",
                "Allergies connues ?"
            ],
            niveau_urgence: age > 60 || motif.includes("thoracique") ? "jaune" : "verte",
            avertissement: "Cette analyse est générée automatiquement et ne remplace pas le jugement médical."
        };

        return NextResponse.json({ 
            ok: true, 
            data: result
        });

    } catch (error) {
        console.error("clinical-assistant error:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'analyse", details: error.message },
            { status: 500 }
        );
    }
}
