export async function POST(request) {
  try {
    const body = await request.json();
    const { documentType, patient, consultation, notes, aiAnalysis } = body || {};

    const types = {
      ordonnance: "Ordonnance médicale",
      bilan: "Bilan complémentaire",
      compte_rendu: "Compte rendu de consultation",
      certificat: "Certificat médical",
      arret_travail: "Arrêt de travail"
    };

    if (!types[documentType]) {
      return Response.json(
        { error: "Type invalide" },
        { status: 400 }
      );
    }

    // Extraction des données
    const age = parseInt(patient?.age) || 0;
    const sexe = patient?.sexe || "patient";
    const motif = consultation?.motif || "Consultation";
    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Constantes formatées
    const constantes = {
      ta: consultation?.ta || "Non mesurée",
      fc: consultation?.fc || "Non mesurée",
      spo2: consultation?.spo2 || "Non mesurée",
      t: consultation?.temperature || "Non mesurée"
    };

    // Analyse clinique si disponible
    const analyse = aiAnalysis || {};
    const niveauUrgence = analyse.niveau_urgence || "verte";
    const diagnostics = analyse.diagnostics_probables || [];
    const examens = analyse.bilans_recommandes || [];

    // Générateurs de documents intelligents
    const generators = {
      ordonnance: () => generateOrdonnance({ date, age, sexe, motif, constantes, diagnostics, niveauUrgence }),
      bilan: () => generateBilan({ date, age, sexe, motif, constantes, diagnostics, examens, niveauUrgence }),
      compte_rendu: () => generateCompteRendu({ date, age, sexe, motif, constantes, diagnostics, analyse, notes }),
      certificat: () => generateCertificat({ date, age, sexe, motif, niveauUrgence }),
      arret_travail: () => generateArretTravail({ date, age, sexe, motif, niveauUrgence, diagnostics })
    };

    const document = generators[documentType]();

    return Response.json({
      ok: true,
      data: {
        titre: types[documentType],
        contenu: document,
        avertissement: "Document généré automatiquement à partir des données de la consultation. À vérifier, compléter et signer par le médecin.",
        metadata: {
          type: documentType,
          date_generation: date,
          niveau_urgence: niveauUrgence,
          motif: motif
        }
      }
    });

  } catch (error) {
    console.error("generate-medical-document error:", error);
    return Response.json(
      { error: "Erreur lors de la génération", details: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// TEMPLATES DE DOCUMENTS MÉDICAUX
// ============================================

function generateOrdonnance({ date, age, sexe, motif, constantes, diagnostics, niveauUrgence }) {
  const urgenceTag = niveauUrgence !== 'verte' ? `[URGENCE: ${niveauUrgence.toUpperCase()}]` : '';
  
  let medicaments = [];
  
  // Propositions selon le motif
  if (motif.includes("thoracique")) {
    medicaments = [
      "PARACÉTAMOL 500 mg, 1 à 2 comprimés toutes les 6 heures si douleur",
      "TRINITRINE 0,4 mg sublingual, 1 comprimé en cas de douleur intense (si PAS > 100 mmHg)",
      "ASPIRINE 75 mg, 1 comprimé par jour (si suspicion coronarienne)"
    ];
  } else if (motif.includes("abdominale")) {
    medicaments = [
      "PARACÉTAMOL 500 mg, 1 à 2 comprimés toutes les 6 heures",
      "SPASFON, 1 comprimé toutes les 8 heures si douleur spasmodique",
      "SMECTA 3 g, 1 sachet 3 fois par jour si troubles digestifs"
    ];
  } else if (motif.includes("tête") || motif.includes("céphalée")) {
    medicaments = [
      "PARACÉTAMOL 1 g, 1 comprimé toutes les 6 heures si douleur",
      "IBUPROFÈNE 400 mg, 1 comprimé toutes les 8 heures (si pas d'antécédent ulcéreux)",
      "ANTALGIQUE PALIER II si inefficacité du paracétamol"
    ];
  } else {
    medicaments = [
      "PARACÉTAMOL 500 mg, 1 à 2 comprimés toutes les 6 heures si nécessaire",
      "TRAITEMENT ADAPTÉ AU DIAGNOSTIC RETENU"
    ];
  }

  return `═══════════════════════════════════════
${urgenceTag}
           ORDONNANCE MÉDICALE
═══════════════════════════════════════

Date: ${date}
Dr Hammach Yassine - Médecin Généraliste

----------------------------------------
INFORMATIONS PATIENT
----------------------------------------
Patient: ${sexe} de ${age} ans
Motif de consultation: ${motif}

Constantes:
• Tension artérielle: ${constantes.ta} mmHg
• Fréquence cardiaque: ${constantes.fc} bpm
• Saturation O2: ${constantes.spo2}%
• Température: ${constantes.t}°C

----------------------------------------
MÉDICAMENTS PRESCRITS
----------------------------------------
${medicaments.map((med, i) => `${i + 1}. ${med}`).join('\n')}

----------------------------------------
CONSEILS AU PATIENT
----------------------------------------
• Respecter les posologies indiquées
• En cas d'aggravation ou de persistance des symptômes 
  au-delà de 48 heures, consulter en urgence
• Apporter ce document à votre pharmacien
• Conserver ce document pour votre dossier médical

----------------------------------------
DIAGNOSTIC PRÉSUMÉ (à confirmer)
----------------------------------------
${diagnostics.length > 0 ? diagnostics.slice(0, 2).join('\n') : 'À préciser par examen clinique'}

----------------------------------------
Signature du médecin: _________________

Cachet:
═══════════════════════════════════════`;
}

function generateBilan({ date, age, sexe, motif, constantes, diagnostics, examens, niveauUrgence }) {
  const urgenceTag = niveauUrgence !== 'verte' ? `[PRIORITÉ: ${niveauUrgence.toUpperCase()}]` : '';
  
  // Examens prioritaires selon l'urgence
  const priorite = niveauUrgence === 'rouge' ? 'URGENT - Réaliser dans les 2 heures' :
                   niveauUrgence === 'orange' ? 'PRIORITAIRE - Réaliser dans la journée' :
                   'Programmé - Réaliser dans les 48 heures';

  return `═══════════════════════════════════════
${urgenceTag}
      BILAN COMPLÉMENTAIRE DEMANDÉ
═══════════════════════════════════════

Date: ${date}
Dr Hammach Yassine - Médecin Généraliste

----------------------------------------
INFORMATIONS PATIENT
----------------------------------------
Patient: ${sexe} de ${age} ans
Motif: ${motif}
Niveau d'urgence: ${niveauUrgence.toUpperCase()}

----------------------------------------
EXAMENS DEMANDÉS
----------------------------------------
${examens.length > 0 ? examens.map((ex, i) => `${i + 1}. ${ex}`).join('\n') : 'À préciser selon évolution clinique'}

----------------------------------------
BIOLOGIE STANDARD
----------------------------------------
• NFS (Numération Formule Sanguine)
• CRP (Protéine C Réactive)
• Ionogramme sanguin (Na, K, Cl)
• Fonction rénale (Créatinine, DFG)
• Fonction hépatique (Transaminases, Bilirubine)

----------------------------------------
IMAGERIE
----------------------------------------
${motif.includes("thoracique") ? '• ECG 12 dérivations\n• Radio thorax de face et profil' : 
  motif.includes("abdominale") ? '• Échographie abdomino-pelvienne\n• Scanner abdominal si doute' :
  motif.includes("tête") ? '• Scanner cérébral sans injection\n• IRM cérébrale si indication' :
  '• Imagerie adaptée au contexte clinique'}

----------------------------------------
AUTRES EXAMENS
----------------------------------------
${age > 50 ? '• Bilan lipidique\n• Glycémie à jeun\n• HbA1c' : '• Bilan selon contexte'}

----------------------------------------
PRIORITÉ DE RÉALISATION
----------------------------------------
${priorite}

----------------------------------------
ADRESSE DE RÉSULTATS
----------------------------------------
Dr Hammach Yassine
[Cabinet médical]
Email: [adresse professionnelle]
Tél: [numéro]

----------------------------------------
Signature: _________________
═══════════════════════════════════════`;
}

function generateCompteRendu({ date, age, sexe, motif, constantes, diagnostics, analyse, notes }) {
  const synthese = analyse?.synthese_constantes?.interpretation || "À compléter";
  
  return `═══════════════════════════════════════
      COMPTE RENDU DE CONSULTATION
═══════════════════════════════════════

Date: ${date}
Dr Hammach Yassine - Médecin Généraliste

----------------------------------------
IDENTIFICATION
----------------------------------------
Patient: ${sexe} de ${age} ans

----------------------------------------
MOTIF DE CONSULTATION
----------------------------------------
${motif}

----------------------------------------
HISTOIRE DE LA MALADIE
----------------------------------------
[À compléter par le médecin]
${notes ? `\nNotes de l'assistante:\n${notes}` : ''}

----------------------------------------
CONSTANTES VITALES
----------------------------------------
• Tension artérielle: ${constantes.ta} mmHg
• Fréquence cardiaque: ${constantes.fc} bpm
• Fréquence respiratoire: [À mesurer]
• Saturation O2: ${constantes.spo2}%
• Température: ${constantes.t}°C
• Glycémie capillaire: [Si indication]

INTERPRÉTATION: ${synthese}

----------------------------------------
EXAMEN CLINIQUE
----------------------------------------
[À compléter par le médecin]
• Aspect général:
• Examen cardio-vasculaire:
• Examen respiratoire:
• Examen abdominal:
• Examen neurologique:
• Autres:

----------------------------------------
DIAGNOSTIC
----------------------------------------
Hypothèses diagnostiques:
${diagnostics.length > 0 ? diagnostics.slice(0, 3).map((d, i) => `${i + 1}. ${d}`).join('\n') : '1. [À préciser]'}

Diagnostic retenu: [À confirmer]

----------------------------------------
CONDUITE THÉRAPEUTIQUE
----------------------------------------
[À détailler par le médecin]
• Traitement prescrit:
• Mesures hygiéno-diététiques:
• Surveillance recommandée:

----------------------------------------
EXAMENS COMPLÉMENTAIRES
----------------------------------------
[À préciser si nécessaire]

----------------------------------------
ÉVOLUTION ET PRONOSTIC
----------------------------------------
[À compléter]

----------------------------------------
SUIVI
--------------------------------__
Prochain rendez-vous: [À planifier]

----------------------------------------
Signature: _________________
Cachet:
═══════════════════════════════════════`;
}

function generateCertificat({ date, age, sexe, motif, niveauUrgence }) {
  return `═══════════════════════════════════════
         CERTIFICAT MÉDICAL
═══════════════════════════════════════

Je soussigné, Dr Hammach Yassine, médecin généraliste,
exerçant à [adresse du cabinet],

CERTIFIE AVOIR EXAMINÉ ce jour :

----------------------------------------
IDENTITÉ DU PATIENT
--------------------------------__
${sexe} né(e) le [date de naissance]
Âge: ${age} ans

----------------------------------------
ÉTAT DE SANTÉ
----------------------------------------
Le/La patient(e) présente: ${motif}

État général: [À compléter par le médecin]
• Conscience: [Claire/Altérée]
• Constantes: [Stables/Instables]

----------------------------------------
APTITUDES
----------------------------------------
☐ Apte à toute activité
☐ Inapte temporairement à toute activité professionnelle
☐ Inapte à la conduite de véhicules
☐ Nécessite un aménagement de poste
☐ Autre: [Préciser]

----------------------------------------
VALIDITÉ
--------------------------------__
Ce certificat est valable du ${date} au [date de fin]

----------------------------------------
DESTINATION
--------------------------------__
☐ Employeur
☐ École/Université
☐ Administration
☐ Assurance
☐ Autre: [Préciser]

----------------------------------------
Fait à [ville], le ${date}

Signature et cachet du médecin:
_________________________________
Dr Hammach Yassine
Médecin Généraliste
N° Ordre: [numéro]

═══════════════════════════════════════`;
}

function generateArretTravail({ date, age, sexe, motif, niveauUrgence, diagnostics }) {
  const duree = niveauUrgence === 'rouge' ? '3 jours' :
                niveauUrgence === 'orange' ? '5 jours' :
                niveauUrgence === 'jaune' ? '7 jours' : '2 jours';

  const motifPrincipal = diagnostics.length > 0 ? 
    diagnostics[0].split('(')[0].trim() : motif;

  return `═══════════════════════════════════════
         ARRÊT DE TRAVAIL
═══════════════════════════════════════

Je soussigné, Dr Hammach Yassine, médecin généraliste,

ARRÊTE LE TRAVAIL pour raison de santé:

----------------------------------------
IDENTITÉ DU PATIENT
--------------------------------__
Nom: [NOM]
Prénom: [PRÉNOM]
Né(e) le: [DATE DE NAISSANCE]
Sexe: ${sexe}
Âge: ${age} ans

----------------------------------------
ARRÊT DE TRAVAIL
----------------------------------------
Du: ${date}
Au: [DATE DE FIN - Durée préconisée: ${duree}]

Motif principal: ${motifPrincipal}
Diagnostic associé: ${motif}

----------------------------------------
PATHOLOGIE
--------------------------------__
Nature de l'affection: [À préciser par le médecin]
Évolution prévisible: [Favorable/Sous réserve]

----------------------------------------
TRAITEMENT EN COURS
--------------------------------__
[À compléter par le médecin]

----------------------------------------
RÉSERVES ÉVENTUELLES
--------------------------------__
☐ Nécessite surveillance médicale rapprochée
☐ Contre-indication temporaire à certains gestes professionnels
☐ Aménagement de poste recommandé
☐ Reprise d'activité partielle possible

----------------------------------------
REPRISE DU TRAVAIL
--------------------------------__
☐ Avec visite de reprise obligatoire
☐ Sans visite de reprise
☐ Reprise progressive suggérée

----------------------------------------
Fait à [ville], le ${date}

Signature et cachet du médecin:
_________________________________
Dr Hammach Yassine
Médecin Généraliste

Ce document est destiné à l'employeur et à la Sécurité Sociale.
═══════════════════════════════════════`;
}
