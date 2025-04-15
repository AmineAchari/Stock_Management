import axios from 'axios';
import authService from './auth.service';
import authHeader from './auth-header';

const API_URL = 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const user = authService.getCurrentUser();
    if (user && user.token) {
      // Use Authorization header instead of x-auth-token
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const apiService = {
  // Stocks
  getAllStocks: () => axiosInstance.get('/stocks'),
  getStockById: (id) => axiosInstance.get(`/stocks/${id}`),
  createStock: (stock) => axiosInstance.post('/stocks', stock),
  updateStock: (id, stock) => axiosInstance.put(`/stocks/${id}`, stock),
  deleteStock: (id) => axiosInstance.delete(`/stocks/${id}`),
  // Récupérer tous les produits d'un stock spécifique
  getProduitsByStock: (stockId) => {
    console.log("Appel de l'API pour récupérer les produits du stock:", stockId);
    // Utiliser le bon endpoint pour récupérer les produits d'un stock    
    return axiosInstance.get(`/produit-stock/stock/${stockId}/produits`, {
      params: { _t: new Date().getTime() }
    });
  },
  
  // Produits
  getAllProduits: () => axiosInstance.get('/produits'),
  getProduitById: (id) => axiosInstance.get(`/produits/${id}`),
  createProduit: (produit) => axiosInstance.post('/produits', produit),
  updateProduit: (id, produit) => axiosInstance.put(`/produits/${id}`, produit),
  deleteProduit: (id) => axiosInstance.delete(`/produits/${id}`),
  
  // Affectation
  affecterProduit: (produitId, stockId, quantite) => {
    const user = authService.getCurrentUser();
    // S'assurer que l'en-tête d'autorisation est explicitement défini
    const headers = {
      'Authorization': `Bearer ${user.token}`
    };
    return axiosInstance.post('/produit-stock/affecter', null, {
      params: { 
        produitId, 
        stockId, 
        quantite
      },
      headers
    });
  },

  // Modifier la quantité d'un produit dans un stock
  modifierQuantite: (produitId, stockId, nouvelleQuantite) => {
    const user = authService.getCurrentUser();
    // S'assurer que l'en-tête d'autorisation est explicitement défini
    const headers = {
      'Authorization': `Bearer ${user.token}`
    };
    return axiosInstance.put('/produit-stock/modifier-quantite', null, {
      params: { 
        produitId, 
        stockId, 
        modification: nouvelleQuantite // Le backend attend "modification" comme nom de paramètre
      },
      headers
    });
  },

  // Ajouter cette méthode à votre service API
  getStatsProduit: (produitId) => axiosInstance.get(`/produits/${produitId}/stats`),

  // Ou obtenir les statistiques par lots
  getStatsProduits: (produitIds) => axiosInstance.post('/produits/stats', { produitIds }),
  
  // Récupérer les stocks groupés par pays
  getStocksByCountry: () => axiosInstance.get('/stocks/by-country'),
  
  // Récupérer les produits par pays
  getProduitsByCountry: (pays) => axiosInstance.get('/produit-stock/pays', {
    params: { pays }
  }),

  // Récupérer les produits en dessous d'un seuil
  getProduitsBelowThreshold: async (threshold = 30) => {
    try {
      const response = await axios.get(`${API_URL}/stocks/produits-seuil`, {
        params: { threshold },
        headers: authHeader()
      });
      return response;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }
};

export default apiService;