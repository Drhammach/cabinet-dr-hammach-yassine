import { NextResponse } from "next/server";

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
        const { documentType, patient, consultation, notes } = body;

        const validTypes = Object.keys(labels);
        if (!validTypes.includes(documentType)) {
            return NextResponse.json(
                { ok: false, error: "Type de document invalide" },
                { status: 400 }
            );
        }

        const age = parseInt(patient?.age) || 0;
        const sexe = patient?.sexe || "patient";
        const motif = consultation?.motif || "consultation";
        const date = new Date().toLocaleDateString('fr-FR');

        // Templates de documents (sans OpenAI)
        const templates = {
            ordonnance: `ORDONNANCE MÉDICALE

Date: ${date}

Le/La patient(e), âgé(e) de ${age} ans, présente ${motif}.

Médicaments prescrits:
- [À compléter par le médecin]

Posologie: [À compléter]

Durée du traitement: [À compléter]

Renouvellement: [À préciser]

---
Dr Hammach Yassine
Médecin Généraliste`,

            bilan: `BILAN / EXAMENS COMPLÉMENTAIRES

Date: ${date}

Patient: ${sexe} de ${age} ans
Motif: ${motif}

Examens demandés:
- NFS, CRP
- Ionogramme sanguin
- Fonction rénale
- [Autres examens à préciser]

Imagerie:
- [À compléter selon indication]

Résultats à transmettre au cabinet.

---
Dr Hammach Yassine
Médecin Généraliste`,

            compte_rendu: `COMPTE RENDU DE CONSULTATION

Date: ${date}

Patient: ${sexe} de ${age} ans

Motif de consultation: ${motif}

Constantes:
- TA: ${consultation?.ta || 'Non mesurée'}
- FC: ${consultation?.fc || 'Non mesurée'}
- SpO2: ${consultation?.spo2 || 'Non mesurée'}%
- T°: ${consultation?.temperature || 'Non mesurée'}°C

Examen clinique:
[À compléter par le médecin]

Conduite tenue:
[À détailler]

---
Dr Hammach Yassine
Médecin Généraliste`,

            certificat: `CERTIFICAT MÉDICAL

Je soussigné, Dr Hammach Yassine, médecin généraliste,

certifie avoir examiné ce jour le/la patient(e) âgé(e) de ${age} ans.

État général: [À compléter]
Motif: ${motif}

Ce certificat est délivré pour servir et valoir ce que de droit.

Fait à [ville], le ${date}

---
Dr Hammach Yassine
Médecin Généraliste`,

            arret_travail: `ARRÊT DE TRAVAIL

Je soussigné, Dr Hammach Yassine, médecin généraliste,

déclare que l'état de santé du/de la patient(e) âgé(e) de ${age} ans,

nécessite un arrêt de travail de [nombre] jour(s) à compter du ${date}.

Motif: ${motif}

Cet arrêt est délivré pour servir et valoir ce que de droit.

---
Dr Hammach Yassine
Médecin Généraliste`
        };

        return NextResponse.json({ 
            ok: true, 
            data: {
                titre: labels[documentType],
                contenu: templates[documentType],
                avertissement: "Document généré automatiquement. À compléter et valider par le médecin."
            }
        });

    } catch (error) {
        console.error("generate-medical-document error:", error);
        return NextResponse.json(
            { ok: false, error: "Erreur lors de la génération" },
            { status: 500 }
        );
    }
}
