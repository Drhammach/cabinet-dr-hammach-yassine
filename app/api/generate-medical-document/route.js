import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            documentType,
            patient = {},
            consultation = {},
            notes = "",
            aiAnalysis = null,
        } = body || {};

        const labels = {
            ordonnance: "Ordonnance médicale",
            bilan: "Bilan / examens complémentaires",
            compte_rendu: "Compte rendu de consultation",
            certificat: "Certificat médical",
            arret_travail: "Arrêt de travail",
        };

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-5.4",
            input: [
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text:
                                "Tu es un assistant médical pour médecin généraliste. " +
                                "Tu aides à rédiger des documents médicaux en français, de manière claire, professionnelle, concise et modifiable. " +
                                "Tu ne remplaces pas le jugement médical. " +
                                "Tu dois renvoyer un JSON strict. " +
                                "Pour les traitements, reste prudent, contextualisé, sans présenter cela comme une vérité absolue. " +
                                "Si le contexte est insuffisant, tu l'indiques clairement dans le document.",
                        },
                    ],
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text:
                                `Type de document à générer : ${labels[documentType] || documentType}\n\n` +
                                JSON.stringify(
                                    {
                                        documentType,
                                        patient,
                                        consultation,
                                        notes,
                                        aiAnalysis,
                                    },
                                    null,
                                    2
                                ),
                        },
                    ],
                },
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "medical_document_output",
                    strict: true,
                    schema: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            titre: { type: "string" },
                            contenu: { type: "string" },
                            avertissement: { type: "string" },
                        },
                        required: ["titre", "contenu", "avertissement"],
                    },
                },
            },
        });

        const parsed = JSON.parse(response.output_text);

        return NextResponse.json({ ok: true, data: parsed });
    } catch (error) {
        console.error("generate-medical-document error", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la génération du document." },
            { status: 500 }
        );
    }
}