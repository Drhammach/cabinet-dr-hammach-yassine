import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        const body = await req.json();
        
        // Log pour déboguer - voir ce que le frontend envoie
        console.log("clinical-assistant body:", body);

        const { 
            patientId, 
            consultationId,
            motif,
            symptoms,
            constants,
            patientAge,
            patientSexe 
        } = body;

        // Validation plus souple - accepter motif OU symptoms
        const symptomesOuMotif = motif || symptoms || "";
        
        if (!patientId || !symptomesOuMotif) {
            return NextResponse.json(
                { error: "Données manquantes: patientId et motif requis", received: body },
                { status: 400 }
            );
        }

        const anonymizedData = {
            age: patientAge,
            sexe: patientSexe,
            motif: symptomesOuMotif,
            symptoms: symptoms || "",
            constants: {
                ta: constants?.ta || null,
                fc: constants?.fc || null,
                spo2: constants?.spo2 || null,
                temperature: constants?.temperature || null
            }
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

        return NextResponse.json({ 
            ok: true, 
            data: result,
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
