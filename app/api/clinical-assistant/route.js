export async function POST(request) {
  try {
    const body = await request.json();
    
    // Log pour debug
    console.log("Clinical assistant appelé:", JSON.stringify(body, null, 2));
    
    const { patient, consultation } = body || {};
    
    if (!patient || !consultation) {
      return Response.json(
        { error: "patient et consultation requis" },
        { status: 400 }
      );
    }

    // Réponse immédiate sans traitement complexe
    return Response.json({
      ok: true,
      data: {
        resume_clinique: `Patient ${patient?.sexe || "?"} de ${patient?.age || "?"} ans - ${consultation?.motif || "?"}`,
        diagnostics_probables: [
          "Diagnostic 1 (score: 70)",
          "Diagnostic 2 (score: 50)", 
          "Diagnostic 3 (score: 30)"
        ],
        diagnostics_graves_a_eliminer: ["Gravité 1", "Gravité 2"],
        red_flags: ["Red flag 1", "Red flag 2"],
        bilans_recommandes: ["Bilan 1", "Bilan 2"],
        conduite_a_tenir: ["Conduite 1", "Conduite 2"],
        propositions_therapeutiques: ["Traitement 1", "Traitement 2"],
        questions_utiles: ["Question 1", "Question 2"],
        niveau_urgence: "verte",
        avertissement: "Test - Mode simplifié"
      }
    });
    
  } catch (error) {
    console.error("Erreur:", error);
    return Response.json(
      { error: "Erreur serveur", message: error.message },
      { status: 500 }
    );
  }
}
