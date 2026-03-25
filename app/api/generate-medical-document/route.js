import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const labels = {
    ordonnance: "Ordonnance médicale",
    bilan: "Bilan / examens complémentaires",
    compte_rendu: "Compte rendu de consultation",
    certificat: "Certificat médical",
    arret_travail: "Arrêt de travail"
};

export async function POST(req) {
    try {
        const body = await req.json();
        
        // Log pour déboguer
        console.log("generate-medical-document body:", body);

        const { 
            documentType, 
            patientAge, 
            patientSexe, 
            motif, 
            constants, 
            symptoms, 
            diagnostic, 
            notes = "" 
        } = body;

        const validTypes = Object.keys(labels);
        if (!validTypes.includes(documentType)) {
            return NextResponse.json(
                { ok: false, error: "Type de document invalide", validTypes },
                { status: 400 }
            );
        }

        // Données pour l'IA
        const anonymizedData = {
            documentType,
            patient: {
                age: patientAge,
                sexe: patientSexe
            },
            consultation: {
                motif: motif || "",
                constantes: constants || {},
                symptomes: symptoms || "",
                diagnostic: diagnostic || ""
            },
            notes_medecin: notes
        };

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            input: [
                {
                    role: "system",
                    content: `Tu es un assistant médical pour médecin généraliste.
                    
RÈGLES STRICTES:
1. Rédige un document médical professionnel en français
2. Utilise uniquement "Le patient" ou "La patiente" (PAS de nom/prénom)
3. Mentionne l'âge si pertinent
4. Inclus un avertissement légal obligatoire
5. Ne remplace pas le jugement médical

FORMAT JSON:
{
  "titre": "string",
  "contenu": "string (texte complet)",
  "avertissement": "Document généré par IA à titre indicatif. Validation médicale obligatoire."
}`
                },
                {
                    role: "user",
                    content: `Document: ${labels[documentType]}\n\n${JSON.stringify(anonymizedData, null, 2)}`
                }
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "medical_document",
                    strict: true,
                    schema: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            titre: { type: "string" },
                            contenu: { type: "string" },
                            avertissement: { type: "string" }
                        },
                        required: ["titre", "contenu", "avertissement"]
                    }
                }
            }
        });

        const parsed = JSON.parse(response.output_text);

        return NextResponse.json({ 
            ok: true, 
            data: parsed
        });

    } catch (error) {
        console.error("generate-medical-document error:", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la génération", details: error.message },
            { status: 500 }
        );
    }
}
