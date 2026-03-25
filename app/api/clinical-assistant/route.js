import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        const body = await req.json();
        
        console.log("clinical-assistant body:", body);

        // Format reçu du frontend:
        // { patient: { nom, age, sexe, telephone }, consultation: { motif, ta, fc... }, notes }
        const { patient, consultation, notes } = body;

        if (!patient || !consultation) {
            return NextResponse.json(
                { error: "Données manquantes: patient et consultation requis", received: body },
                { status: 400 }
            );
        }

        // Adapter au format attendu par l'IA
        const anonymizedData = {
            age: patient.age,
            sexe: patient.sexe,
            motif: consultation.motif,
            symptoms: "", // Pas de champ symptoms séparé dans votre frontend
            constants: {
                ta: consultation.ta || null,
                fc: consultation.fc || null,
                spo2: consultation.spo2 || null,
                temperature: consultation.temperature || null
            },
            notes: notes || ""
        };

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            input: [
                {
                    role: "system",
                    content: `Tu es un assistant diagnostic pour médecin généraliste.
                    
RÈGLES:
- Propose 3 diagnostics probables avec scores (0-100)
- Liste les red flags à éliminer
- Suggère des examens pertinents
- Niveau urgence: vert/jaune/orange/rouge
- Ne donne JAMAIS de diagnostic définitif
- Format JSON strict uniquement

FORMAT:
{
  "top3": [{"diagnostic": "string", "score": number, "justification": "string"}],
  "redFlags": ["string"],
  "examens": ["string"],
  "conduite": "string",
  "niveauUrgence": "verte|jaune|orange|rouge"
}`
                },
                {
                    role: "user",
                    content: JSON.stringify(anonymizedData)
                }
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "clinical_analysis",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            top3: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        diagnostic: { type: "string" },
                                        score: { type: "number" },
                                        justification: { type: "string" }
                                    },
                                    required: ["diagnostic", "score"]
                                }
                            },
                            redFlags: { 
                                type: "array", 
                                items: { type: "string" } 
                            },
                            examens: { 
                                type: "array", 
                                items: { type: "string" } 
                            },
                            conduite: { type: "string" },
                            niveauUrgence: { 
                                type: "string", 
                                enum: ["verte", "jaune", "orange", "rouge"] 
                            }
                        },
                        required: ["top3", "redFlags", "niveauUrgence"]
                    }
                }
            }
        });

        const result = JSON.parse(response.output_text);

        // Adapter la réponse au format attendu par le frontend
        // Le frontend attend: resume_clinique, diagnostics_probables, diagnostics_graves_a_eliminer, etc.
        const formattedResult = {
            resume_clinique: `Patient ${patient.sexe} de ${patient.age} ans présentant ${consultation.motif}.`,
            diagnostics_probables: result.top3.map(d => `${d.diagnostic} (score: ${d.score})`),
            diagnostics_graves_a_eliminer: result.redFlags.slice(0, 3),
            red_flags: result.redFlags,
            bilans_recommandes: result.examens,
            conduite_a_tenir: result.conduite ? [result.conduite] : [],
            propositions_therapeutiques: ["À adapter selon diagnostic retenu"],
            questions_utiles: ["Antécédents similaires?", "Traitement en cours?", "Allergies?"],
            niveau_urgence: result.niveauUrgence,
            avertissement: "Cette analyse est générée par IA et ne remplace pas le jugement médical."
        };

        return NextResponse.json({ 
            ok: true, 
            data: formattedResult,
            warning: "Analyse IA indicative - validation médicale requise"
        });

    } catch (error) {
        console.error("clinical-assistant error:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'analyse", details: error.message },
            { status: 500 }
        );
    }
}
