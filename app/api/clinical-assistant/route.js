export async function POST(request) {
  try {
    const body = await request.json();
    const { patient, consultation, notes } = body || {};

    if (!patient || !consultation) {
      return Response.json(
        { error: "patient et consultation requis" },
        { status: 400 }
      );
    }

    // Extraction des données de la fiche assistante
    const age = parseInt(patient.age) || 0;
    const sexe = patient.sexe || "non précisé";
    const motif = consultation.motif || "non précisé";
    const constantes = {
      ta: consultation.ta || "Non mesurée",
      fc: consultation.fc || "Non mesurée",
      spo2: consultation.spo2 || "Non mesurée",
      temperature: consultation.temperature || "Non mesurée"
    };

    // Base de connaissances médicales pour pré-solutions
    const baseMedicale = {
      "Douleur thoracique": {
        resume: "Douleur thoracique chez un patient de " + age + " ans",
        gravite: age > 50 || constantes.fc > 100 ? "MODÉRÉE" : "FAIBLE",
        differentiels: [
          { diag: "Douleur pariétale/musculaire", proba: 40, urgence: "verte" },
          { diag: "Reflux gastro-œsophagien", proba: 25, urgence: "verte" },
          { diag: "Syndrome coronarien aigu", proba: age > 50 ? 20 : 5, urgence: "rouge" },
          { diag: "Embolie pulmonaire", proba: constantes.spo2 < 95 ? 15 : 5, urgence: "rouge" }
        ],
        examens: ["ECG 12 dérivations", "Troponines si âge > 40 ans", "Radio thorax si dyspnée associée"],
        conduite: [
          "Éliminer les signes de gravité (sueurs, nausées, irradiation bras gauche)",
          "Mesure de la pression artérielle bilatérale",
          "Repos jusqu'à évaluation médicale complète"
        ],
        therapeutique: [
          "Antalgique palier I (paracétamol) en attendant le médecin",
          "Nitroglycérine sublinguale SI douleur typique et PAS > 100 mmHg",
          "Oxygène si SpO2 < 94%"
        ]
      },
      
      "Dyspnée": {
        resume: "Dyspnée chez un patient de " + age + " ans",
        gravite: constantes.spo2 < 94 ? "ÉLEVÉE" : "MODÉRÉE",
        differentiels: [
          { diag: "Asthme/BPCO", proba: 35, urgence: "jaune" },
          { diag: "Pneumonie", proba: constantes.temperature > 38 ? 30 : 15, urgence: "orange" },
          { diag: "Œdème aigu pulmonaire", proba: constantes.fc > 100 ? 20 : 10, urgence: "rouge" },
          { diag: "Embolie pulmonaire", proba: constantes.spo2 < 90 ? 20 : 10, urgence: "rouge" }
        ],
        examens: ["SpO2 continue", "ECG", "Radio thorax", "BNP si suspicion OAP"],
        conduite: [
          "Position demi-assise (45°)",
          "Oxygénothérapie ciblée SpO2 > 94%",
          "Surveillance FC et FR toutes les 15 min"
        ],
        therapeutique: [
          "Bronchodilatateurs si asthme/BPCO connu",
          "Diurétiques SI œdème pulmonaire confirmé",
          "Anticoagulation SI suspicion d'embolie"
        ]
      },

      "Douleur abdominale": {
        resume: "Douleur abdominale chez un patient de " + age + " ans",
        gravite: constantes.temperature > 38 ? "MODÉRÉE" : "FAIBLE",
        differentiels: [
          { diag: "Gastro-entérite", proba: 40, urgence: "verte" },
          { diag: "Appendicite", proba: motif.includes("fossa") ? 35 : 15, urgence: "orange" },
          { diag: "Cholécystite", proba: 15, urgence: "jaune" },
          { diag: "Occlusion intestinale", proba: 10, urgence: "rouge" }
        ],
        examens: ["NFS, CRP", "Amylase", "Échographie abdominale", "Scanner si doute"],
        conduite: [
          "Évaluation de la défense et contracture",
          "Recherche de signes d'irritation péritonéale",
          "Jeûne en attendant le médecin si douleur intense"
        ],
        therapeutique: [
          "Antalgique palier I-II",
          "Antispasmodique",
          "Rhydratation orale si tolérée"
        ]
      },

      "Fièvre": {
        resume: "Fièvre chez un patient de " + age + " ans",
        gravite: constantes.temperature > 39.5 ? "MODÉRÉE" : "FAIBLE",
        differentiels: [
          { diag: "Infection virale", proba: 50, urgence: "verte" },
          { diag: "Infection urinaire", proba: 20, urgence: "verte" },
          { diag: "Pneumonie", proba: 15, urgence: "jaune" },
          { diag: "Sepsis", proba: constantes.fc > 100 && constantes.temperature > 39 ? 10 : 2, urgence: "rouge" }
        ],
        examens: ["NFS, CRP, PCT", "BU/ECBU", "Hémocultures si temp > 39.5°C", "Radio thorax si toux"],
        conduite: [
          "Mesures hygiéno-diététiques",
          "Hydratation forcée",
          "Surveillance température toutes les 2 heures"
        ],
        therapeutique: [
          "Antipyrétique (paracétamol)",
          "Antibiotique SI orientation bactérienne évidente",
          "Antibiothérapie probabiliste urgente SI sepsis suspecté"
        ]
      },

      "Céphalée": {
        resume: "Céphalée chez un patient de " + age + " ans",
        gravite: age > 50 ? "MODÉRÉE" : "FAIBLE",
        differentiels: [
          { diag: "Céphalée de tension", proba: 45, urgence: "verte" },
          { diag: "Migraine", proba: 30, urgence: "verte" },
          { diag: "Sinusite", proba: 15, urgence: "verte" },
          { diag: "Hémorragie méningée", proba: 5, urgence: "rouge" },
          { diag: "AVC", proba: age > 60 ? 5 : 1, urgence: "rouge" }
        ],
        examens: ["Examen neurologique complet", "Tension artérielle", "FC", "Scanner cérébral SI signes de gravité"],
        conduite: [
          "Recherche de signes d'appel neurologiques",
          "Échelle EVA douleur",
          "Isolement dans un environnement calme"
        ],
        therapeutique: [
          "Antalgique palier I-II",
          "Triptan SI migraine typique et déjà diagnostiquée",
          "Antiémétique si nausées associées"
        ]
      }
    };

    // Récupérer la base médicale ou créer une générique
    const medicalData = baseMedicale[motif] || {
      resume: `Symptomatologie: ${motif} chez un patient de ${age} ans`,
      gravite: "À ÉVALUER",
      differentiels: [
        { diag: "Étiologie fonctionnelle", proba: 40, urgence: "verte" },
        { diag: "Étiologie organique bénigne", proba: 35, urgence: "verte" },
        { diag: "Étiologie organique grave", proba: 15, urgence: "jaune" }
      ],
      examens: ["Bilan biologique standard", "Imagerie adaptée au contexte"],
      conduite: [
        "Examen clinique complet",
        "Élimination des signes de gravité",
        "Surveillance attentive"
      ],
      therapeutique: [
        "Traitement symptomatique",
        "Réévaluation rapide",
        "Orientation spécialisée si persistance"
      ]
    };

    // Construction de la réponse structurée
    const result = {
      // SYNTHÈSE CLINIQUE
      resume_clinique: medicalData.resume,
      
      // NIVEAU DE GRAVITÉ
      niveau_urgence: medicalData.differentiels.some(d => d.urgence === "rouge" && d.proba > 10) ? "orange" : 
                      medicalData.differentiels.some(d => d.urgence === "orange") ? "jaune" : "verte",
      
      gravite_evaluation: medicalData.gravite,

      // DIAGNOSTICS DIFFÉRENTIELS PONDÉRÉS
      diagnostics_probables: medicalData.differentiels
        .sort((a, b) => b.proba - a.proba)
        .slice(0, 3)
        .map(d => `${d.diag} (probabilité: ${d.proba}%, urgence: ${d.urgence})`),

      diagnostics_graves_a_eliminer: medicalData.differentiels
        .filter(d => d.urgence === "rouge" || d.urgence === "orange")
        .map(d => d.diag),

      // RED FLAGS SPÉCIFIQUES
      red_flags: [
        "Altération de l'état général",
        "Douleur intense persistante > 30 min",
        "Signes de choc (PA < 90, FC > 120)",
        ...(constantes.spo2 < 94 ? ["Hypoxémie (SpO2 < 94%)"] : []),
        ...(constantes.temperature > 39 ? ["Hyperthermie > 39°C"] : []),
        ...(constantes.fc > 120 ? ["Tachycardie > 120 bpm"] : [])
      ],

      // EXAMENS RECOMMANDÉS
      bilans_recommandes: medicalData.examens,

      // CONDUITE À TENIR
      conduite_a_tenir: medicalData.conduite,

      // PROPOSITIONS THÉRAPEUTIQUES PRÉLIMINAIRES
      propositions_therapeutiques: medicalData.therapeutique,

      // QUESTIONS CLÉS POUR LE MÉDECIN
      questions_utiles: [
        "Durée et évolution des symptômes ?",
        "Facteurs déclenchants et soulageants ?",
        "Antécédents médicaux et chirurgicaux ?",
        "Traitement en cours et allergies ?",
        "Mode de vie (tabac, alcool, activité physique) ?"
      ],

      // SYNTHÈSE DES CONSTANTES
      synthese_constantes: {
        tension: constantes.ta,
        frequence_cardiaque: constantes.fc,
        saturation: constantes.spo2,
        temperature: constantes.temperature,
        interpretation: interpreterConstantes(constantes, age)
      },

      // NOTES ASSISTANTE INTÉGRÉES
      notes_assistante: notes || "Aucune note complémentaire",

      avertissement: "Cette analyse est générée automatiquement à partir des données de la fiche assistante. Elle ne remplace pas l'évaluation médicale complète et doit être validée par le médecin."
    };

    return Response.json({ 
      ok: true, 
      data: result
    });

  } catch (error) {
    console.error("clinical-assistant error:", error);
    return Response.json(
      { error: "Erreur lors de l'analyse", details: error.message },
      { status: 500 }
    );
  }
}

// Fonction d'interprétation des constantes
function interpreterConstantes(constantes, age) {
  const interpretations = [];
  
  if (constantes.ta) {
    const [sys, dia] = constantes.ta.split('/').map(Number);
    if (sys > 140 || dia > 90) interpretations.push("HTA");
    if (sys < 90) interpretations.push("Hypotension");
  }
  
  if (constantes.fc) {
    const fc = Number(constantes.fc);
    if (fc > 100) interpretations.push("Tachycardie");
    if (fc < 60) interpretations.push("Bradycardie");
  }
  
  if (constantes.spo2) {
    const spo2 = Number(constantes.spo2);
    if (spo2 < 94) interpretations.push("Hypoxémie");
  }
  
  if (constantes.temperature) {
    const temp = Number(constantes.temperature);
    if (temp > 38) interpretations.push("Fièvre");
    if (temp < 36) interpretations.push("Hypothermie");
  }
  
  return interpretations.length > 0 ? interpretations.join(", ") : "Constantes dans les normes";
}
