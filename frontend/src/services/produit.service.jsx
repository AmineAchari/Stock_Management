import axios from "axios";
import authHeader from "./auth-header";

const API_URL = 'http://localhost:8080/api';

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


class ProduitService {
  getAllProduits() {
    return axios.get(`${API_URL}/produits`, { headers: authHeader() });
  }

  getProduitById(id) {
    return axios.get(`${API_URL}/produits/${id}`, { headers: authHeader() });
  }

  createProduit(produit) {
    return axios.post(`${API_URL}/produits`, produit, { headers: authHeader() });
  }

  updateProduit(id, produit) {
    return axios.put(`${API_URL}/produits/${id}`, produit, { headers: authHeader() });
  }

  deleteProduit(id) {
    return axios.delete(`${API_URL}/produits/${id}`, { headers: authHeader() });
  }

  getProduitStocks(id) {
    return axios.get(`${API_URL}/produits/${id}/stocks`, { headers: authHeader() });
  }
}

// Création d'une instance nommée avant export
const produitService = new ProduitService();
export default produitService;