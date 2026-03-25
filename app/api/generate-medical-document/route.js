// app/api/clinical-assistant/route.js
// CORRECTION: Modèle OpenAI + Sécurité
// Vos données patients NE SONT PAS MODIFIÉES

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        // 1. Vérifier session (sécurité)
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !session) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { 
            patientId, 
            consultationId,
            motif,
            symptoms,
            constants,
            patientAge,
            patientSexe 
        } = body;

        // 2. Validation
        if (!patientId || !motif) {
            return NextResponse.json(
                { error: "Données manquantes" },
                { status: 400 }
            );
        }

        // 3. Vérifier que le patient existe (lecture seule)
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('id, consentement_analyse_ia')
            .eq('id', patientId)
            .single();

        if (patientError || !patient) {
            return NextResponse.json(
                { error: "Patient non trouvé" },
                { status: 404 }
            );
        }

        // 4. Vérifier consentement (si vous avez ce champ)
        if (patient.consentement_analyse_ia === false) {
            return NextResponse.json(
                { error: "Consentement patient requis" },
                { status: 403 }
            );
        }

        // 5. Anonymiser les données pour OpenAI
        // ⚠️ ON ENVOIE PAS: nom, prénom, téléphone, adresse, email
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

        // 6. Appel OpenAI - CORRECTION: gpt-4o au lieu de gpt-5.4
        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-4o", // ✅ CORRIGÉ ICI
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

        // 7. Sauvegarder l'analyse (NOUVELLE TABLE - n'existe pas encore)
        // Si vous ne voulez pas sauvegarder, commentez cette partie
        /*
        await supabase.from('analyses_ia').insert({
            consultation_id: consultationId,
            medecin_id: session.user.id,
            patient_id: patientId, // hashé ou masqué
            resultat: result,
            created_at: new Date().toISOString()
        });
        */

        return NextResponse.json({ 
            ok: true, 
            data: result,
            warning: "Analyse IA indicative - validation médicale requise"
        });

    } catch (error) {
        console.error("clinical-assistant error:", error);
        
        // Message générique pour ne pas exposer l'erreur interne
        return NextResponse.json(
            { error: "Erreur lors de l'analyse" },
            { status: 500 }
        );
    }
}
