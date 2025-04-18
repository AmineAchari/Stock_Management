// src/services/affectation.service.jsx
import axios from 'axios';
import authHeader from './auth-header';

const API_URL = 'http://localhost:8080/api/produit-stock'; // URL de base pour ce module

class AffectationService {


  // Dans affectation.service.jsx
createAffectation(produitId, stockId, quantite) {
  return axios.post(`${API_URL}/affecter`, null, {
    headers: authHeader(),
    params: { // Envoi comme paramètres de requête (?produitId=...&stockId=...)
      produitId: produitId,
      stockId: stockId,
      nouvelleQuantite: quantite
    }
  });
}


  getAffectationsByStock(stockId) {
    return axios.get(`${API_URL}/stock/${stockId}/produits`, { headers: authHeader() });
  }

  getAffectationsByProduit(produitId) {
    return axios.get(`${API_URL}/affectations/produit/${produitId}`, { headers: authHeader() });
  }

  updateAffectation(id, affectation) {
    return axios.put(`${API_URL}/affectations/${id}`, affectation, { headers: authHeader() });
  }

  deleteAffectation(id) {
    return axios.delete(`${API_URL}/affectations/${id}`, { headers: authHeader() });
  }

  annulerAffectation(produitId, stockId) {
    return axios.delete(`${API_URL}/annuler-affectation`, {
      headers: authHeader(),
      params: { // Utilise params pour DELETE
        produitId: produitId,
        stockId: stockId
      }
    });
  }

  verifierAffectationExistante(produitId, stockId) {
    return axios.get(`${API_URL}/verifier`, { // Correction: enlevé le /produit-stock redondant
      headers: authHeader(),
      params: {
        produitId,
        stockId
      }
    });
  }
}

// Exporte une instance
const affectationServiceInstance = new AffectationService();
export default affectationServiceInstance;

