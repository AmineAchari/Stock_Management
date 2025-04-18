import axios from "axios";



// Instance axios personnalisée
const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 5000,
});

// Configuration pour les requêtes
const config = {
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
};

class AuthService {
  async login(nomUtilisateur, motDePasse) {
    try {
      console.log("Tentative de connexion pour:", nomUtilisateur);
      const response = await axiosInstance.post("/api/auth/connexion", {
        nomUtilisateur,
        motDePasse,
      }, config);

      console.log("Réponse de connexion:", response.data);
      console.log("Type de token:", typeof response.data.token);
      console.log("Longueur du token:", response.data.token ? response.data.token.length : 0);

      if (response.data.token) {
        // Sauvegarder en tant que chaîne JSON dans localStorage
        localStorage.setItem("user", JSON.stringify(response.data));
        
        // Vérifions immédiatement ce qui est stocké
        const storedUser = localStorage.getItem("user");
        const parsedUser = JSON.parse(storedUser || "{}");
        console.log("Token stocké:", parsedUser.token ? "Oui" : "Non");
        
        // Déclencher l'événement auth-change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event("auth-change"));
        }
      }
      return response.data;
    } catch (error) {
      console.error("Erreur de connexion:", error.response?.data || error.message);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem("user");
    
    // Déclencher l'événement auth-change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event("auth-change"));
    }
  }

  async register(nomUtilisateur, email, motDePasse) {
    return axiosInstance.post("/api/auth/inscription", {
      nomUtilisateur,
      email,
      motDePasse,
      role: "GESTIONNAIRE_STOCK",
    }, config);
  }

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("Utilisateur récupéré du localStorage:", user);
        return user;
      } catch (e) {
        console.error("Erreur lors de la récupération de l'utilisateur:", e);
        return null;
      }
    }
    console.log("Aucun utilisateur trouvé dans localStorage");
    return null;
  }

  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!user && !!user.token;
  }
  
  hasRole(roleName) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Vérification du rôle selon la structure réelle des données
    if (user.roles && Array.isArray(user.roles)) {
      // Si les rôles sont stockés dans un tableau de noms de rôles
      return user.roles.includes(roleName);
    } else if (user.role) {
      // Si le rôle est stocké directement dans une propriété 'role'
      return user.role === roleName;
    } else if (user.authorities && Array.isArray(user.authorities)) {
      // Si les rôles sont stockés dans un tableau d'objets 'authorities'
      return user.authorities.some(auth => 
        auth.authority === roleName || 
        auth.role === roleName || 
        auth === roleName
      );
    }
    
    return false;
  }
}

// Création d'une instance nommée avant export
const authService = new AuthService();
export default authService;