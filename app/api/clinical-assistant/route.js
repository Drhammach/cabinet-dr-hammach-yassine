// app/api/clinical-assistant/route.js - VERSION PIN

import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        // 1. Récupérer le PIN depuis les headers ou body
        const body = await req.json();
        const { 
            patientId, 
            consultationId,
            motif,
            symptoms,
            constants,
            patientAge,
            patientSexe,
            pin  // ← Ajoutez ceci dans le body envoyé par le frontend
        } = body;

        // 2. Vérifier le PIN (à remplacer par votre logique)
        // Option A: PIN statique (simple)
        if (pin !== process.env.MEDECIN_PIN) {
            return NextResponse.json(
                { error: "PIN invalide" },
                { status: 401 }
            );
        }

        // Option B: Vérifier dans Supabase si vous stockez les sessions PIN
        /*
        const { data: session } = await supabase
            .from('sessions_medecin')
            .select('*')
            .eq('pin', pin)
            .eq('actif', true)
            .gt('expire_a', new Date().toISOString())
            .single();
            
        if (!session) {
            return NextResponse.json({ error: "Session invalide" }, { status: 401 });
        }
        */

        // 3. Validation données
        if (!patientId || !motif) {
            return NextResponse.json(
                { error: "Données manquantes" },
                { status: 400 }
            );
        }

        // 4. Anonymiser les données pour OpenAI
        const anonymizedData = {
            age: patientAge,
            sexe: patientSexe,
            motif: motif,
            symptoms: symptoms || "",
            constants: {
                ta: constants?.ta || null,
                fc: constants?.fc || null,
                spo2: constants?.spo2 || null,
                temperature: constants?.temperature || null
            }
        };

        // 5. Appel OpenAI - CORRECTION: gpt-4o
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
            { error: "Erreur lors de l'analyse" },
            { status: 500 }
        );
    }
}
