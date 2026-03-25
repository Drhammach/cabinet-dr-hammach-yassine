// lib/auth.js - VÉRIFICATION SESSION
// Ce fichier vérifie juste que le médecin est connecté
// Ne touche PAS aux données

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function auth() {
    // Si vous utilisez déjà NextAuth, adaptez ici
    // Sinon, vérifiez votre méthode d'auth actuelle
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
            return null;
        }
        
        return {
            user: {
                id: session.user.id,
                email: session.user.email,
                role: session.user.user_metadata?.role || 'MEDECIN'
            }
        };
    } catch (e) {
        return null;
    }
}
