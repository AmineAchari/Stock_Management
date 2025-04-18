// c:\Users\Dell_Amine\Desktop\Stock_Management\frontend\src\services\api.service.jsx

import axios from 'axios';
// authService n'est pas directement utilisé si authHeader fait le travail
// import authService from './auth.service';
import authHeader from './auth-header'; // Fonction qui retourne l'en-tête d'autorisation

// Définition de l'URL de base de l'API
const API_URL = 'http://localhost:8080/api';

// Création d'une instance Axios avec l'URL de base configurée
const axiosInstance = axios.create({
  baseURL: API_URL, // Utilise la constante API_URL ici
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter automatiquement le header d'authentification à chaque requête
axiosInstance.interceptors.request.use(
  (config) => {
    const header = authHeader(); // Récupère { Authorization: 'Bearer ...' } ou {}
    if (header && header.Authorization) {
      config.headers.Authorization = header.Authorization;
    } 
    return config;
  },
  (error) => {
    // Gérer les erreurs de requête ici si besoin
    console.error("Interceptor Request Error:", error);
    return Promise.reject(error);
  }
);

// Définition du service API qui utilise l'instance Axios configurée
const apiService = {

  // === Stocks ===
  getAllStocks: () => axiosInstance.get('/stocks'),
  getStockById: (id) => axiosInstance.get(`/stocks/${id}`),
  createStock: (stock) => axiosInstance.post('/stocks', stock),
  updateStock: (id, stock) => axiosInstance.put(`/stocks/${id}`, stock),
  deleteStock: (id) => axiosInstance.delete(`/stocks/${id}`),
  getStocksByCountry: () => axiosInstance.get('/stocks/by-country'), // Endpoint pour rapport

  // === Produits ===
  getAllProduits: () => axiosInstance.get('/produits'), // Une seule définition
  getProduitById: (id) => axiosInstance.get(`/produits/${id}`),
  createProduit: (produit) => axiosInstance.post('/produits', produit),
  updateProduit: (id, produit) => axiosInstance.put(`/produits/${id}`, produit),
  deleteProduit: (id) => axiosInstance.delete(`/produits/${id}`),
  getStatsProduit: (produitId) => axiosInstance.get(`/produits/${produitId}/stats`),
  getStatsProduits: (produitIds) => axiosInstance.post('/produits/stats', { produitIds }),

  // === ProduitStock / Affectation ===
  getProduitsByStock: (stockId) => {
    console.log("API: getProduitsByStock pour stockId:", stockId);
    return axiosInstance.get(`/produit-stock/stock/${stockId}/produits`);
  },

  // Affecter un produit à un stock (SANS note)
  affecterProduit: (produitId, stockId, quantite) => {
    console.log(`API: affecterProduit - pId:${produitId}, sId:${stockId}, qte:${quantite}`);
    return axiosInstance.post('/produit-stock/affecter', null, {
      params: {
        produitId,
        stockId,
        quantite // Le backend attend 'quantite' pour cet endpoint
        // Pas de 'note' ici
      }
    });
  },

  // Modifier SEULEMENT la quantité
  modifierQuantite: (produitId, stockId, nouvelleQuantite) => {
    console.log(`API: modifierQuantite - pId:${produitId}, sId:${stockId}, qte:${nouvelleQuantite}`);
    return axiosInstance.put('/produit-stock/modifier-quantite', null, {
      params: {
        produitId,
        stockId,
        modification: nouvelleQuantite // Change 'nouvelleQuantite' en 'modification'
      }
    });
  },

  annulerAffectation: (produitId, stockId) => {
    console.log(`API: annulerAffectation - pId:${produitId}, sId:${stockId}`);
    return axiosInstance.delete('/produit-stock/annuler-affectation', {
      params: { produitId, stockId }
    });
  },

  // === Rapports & Statistiques ===
  getProduitsBelowThreshold: (threshold = 10) => {
    console.log(`API: getProduitsBelowThreshold - seuil:${threshold}`);
    return axiosInstance.get(`/produit-stock/stock-faible`, {
      params: { seuil: threshold }
    });
  },

  getStockReportByLocation: (groupBy) => {
    console.log(`API Call: getStockReportByLocation with groupBy=${groupBy}`);
    return axiosInstance.get('/stocks/report/by-location', { // Vérifier si cet endpoint est correct
      params: { groupBy }
    });
  },

  getProduitsByCountry: (pays) => {
    console.log(`API: getProduitsByCountry - pays:${pays}`);
    return axiosInstance.get('/produit-stock/rapport-par-pays', {
      params: { pays }
    });
  },

  getStockStatistics: () => {
    console.log("API: getStockStatistics");
    return axiosInstance.get('/produit-stock/statistics');
  }

};

export default apiService;
