import axios from "axios";
import authHeader from "./auth-header";


// Instance axios personnalisée
const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 5000,
});

// Configurer les intercepteurs pour ajouter des logs
axiosInstance.interceptors.request.use(
  config => {
    console.log("Requête envoyée:", config.method.toUpperCase(), config.url);
    console.log("Headers:", JSON.stringify(config.headers));
    return config;
  },
  error => {
    console.error("Erreur de requête:", error);
    return Promise.reject(error);
  }
);

// Fonction pour obtenir la configuration à jour
const getConfig = () => {
  const headers = {
    ...authHeader(),
    'Content-Type': 'application/json'
  };
  
  return {
    headers,
    withCredentials: false // Essayer les deux options
  };
};

class ProduitService {
  getAllProduits() {
    // Utiliser l'instance axios personnalisée avec le chemin complet
    return axiosInstance.get("/api/produits/", getConfig());
  }

  getProduitById(id) {
    return axiosInstance.get(`/api/produits/${id}`, getConfig());
  }

  createProduit(produit) {
    return axiosInstance.post("/api/produits/", produit, getConfig());
  }

  updateProduit(id, produit) {
    return axiosInstance.put(`/api/produits/${id}`, produit, getConfig());
  }

  deleteProduit(id) {
    return axiosInstance.delete(`/api/produits/${id}`, getConfig());
  }
}

// Création d'une instance nommée avant export
const produitService = new ProduitService();
export default produitService;