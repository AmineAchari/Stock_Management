export default function authHeader() {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      console.log("Aucun utilisateur trouvé dans localStorage");
      return {};
    }

    const user = JSON.parse(userStr);
  
    if (user && user.token) {
      // Supprimer le préfixe "Bearer " si nécessaire
      const tokenValue = user.token.startsWith("Bearer ") 
        ? user.token.slice(7) 
        : user.token;
      
      console.log("Token utilisé (format brut):", tokenValue.substring(0, 20) + "...");
      
      // Format standard avec Bearer
      return { 
        "Authorization": "Bearer " + tokenValue,
        // Ajoutez éventuellement un header personnalisé
        "X-Auth-Token": tokenValue
      };
    } else {
      console.log("Aucun token trouvé dans l'objet utilisateur");
      return {};
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du token:", error);
    return {};
  }
}