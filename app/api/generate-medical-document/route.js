export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log("Generate document appelé:", JSON.stringify(body, null, 2));
    
    const { documentType, patient } = body || {};
    
    const types = {
      ordonnance: "Ordonnance médicale",
      bilan: "Bilan / examens complémentaires",
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

    return Response.json({
      ok: true,
      data: {
        titre: types[documentType],
        contenu: `${types[documentType]}\n\nPatient: ${patient?.sexe || "?"} de ${patient?.age || "?"} ans\n\n[Document à compléter par le médecin]\n\nDr Hammach Yassine`,
        avertissement: "Document généré - À valider par le médecin"
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
