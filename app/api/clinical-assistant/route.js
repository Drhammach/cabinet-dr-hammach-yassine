import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        const body = await req.json();

        const {
            patient = {},
            consultation = {},
            notes = "",
        } = body || {};

        const inputPayload = {
            patient,
            consultation,
            notes,
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
                                "Tu es un assistant clinique pour médecin généraliste. " +
                                "Tu aides à structurer le raisonnement clinique, sans remplacer le jugement médical. " +
                                "Réponds en français, de façon concise, professionnelle et utile au cabinet. " +
                                "Tu dois produire un JSON strict respectant le schéma demandé. " +
                                "Ne donne pas de certitude abusive. " +
                                "Quand une situation paraît urgente, indique clairement les red flags et l'orientation urgente.",
                        },
                    ],
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text:
                                "Analyse cette situation clinique et retourne un JSON structuré.\n\n" +
                                JSON.stringify(inputPayload, null, 2),
                        },
                    ],
                },
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "clinical_assistant_output",
                    schema: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            resume_clinique: { type: "string" },
                            diagnostics_probables: {
                                type: "array",
                                items: { type: "string" },
                            },
                            diagnostics_graves_a_eliminer: {
                                type: "array",
                                items: { type: "string" },
                            },
                            red_flags: {
                                type: "array",
                                items: { type: "string" },
                            },
                            bilans_recommandes: {
                                type: "array",
                                items: { type: "string" },
                            },
                            conduite_a_tenir: {
                                type: "array",
                                items: { type: "string" },
                            },
                            propositions_therapeutiques: {
                                type: "array",
                                items: { type: "string" },
                            },
                            questions_utiles: {
                                type: "array",
                                items: { type: "string" },
                            },
                            niveau_urgence: {
                                type: "string",
                                enum: ["faible", "moderee", "elevee"],
                            },
                            avertissement: { type: "string" },
                        },
                        required: [
                            "resume_clinique",
                            "diagnostics_probables",
                            "diagnostics_graves_a_eliminer",
                            "red_flags",
                            "bilans_recommandes",
                            "conduite_a_tenir",
                            "propositions_therapeutiques",
                            "questions_utiles",
                            "niveau_urgence",
                            "avertissement",
                        ],
                    },
                    strict: true,
                },
            },
        });

        const raw = response.output_text;
        const parsed = JSON.parse(raw);

        return NextResponse.json({ ok: true, data: parsed });
    } catch (error) {
        console.error("clinical-assistant error", error);
        return NextResponse.json(
            {
                ok: false,
                error: "Erreur lors de l'appel à l'assistant IA.",
            },
            { status: 500 }
        );
    }
}