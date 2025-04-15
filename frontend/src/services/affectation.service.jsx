import axios from 'axios';
import authHeader from './auth-header';

const API_URL = 'http://localhost:8080/api';

class AffectationService {
  createAffectation(affectation) {
    return axios.post(`${API_URL}/affectations`, affectation, { 
      headers: authHeader(),
      params: {
        checkExisting: true // Ajouter un flag pour la vérification
      }
    });
  }

  getAffectationsByStock(stockId) {
    return axios.get(`${API_URL}/affectations/stock/${stockId}`, { headers: authHeader() });
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
    return axios.delete(`${API_URL}/produit-stock/annuler-affectation`, {
      headers: authHeader(),
      data: { 
        produitId: produitId,
        stockId: stockId
      }
    });
  }

  verifierAffectationExistante(produitId, stockId) {
    return axios.get(`${API_URL}/produit-stock/verifier`, {
      headers: authHeader(),
      params: {
        produitId,
        stockId
      }
    });
  }
}

export default new AffectationService();