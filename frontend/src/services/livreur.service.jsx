import axios from 'axios';
import authHeader from './auth-header';

const API_URL = 'http://localhost:8080/api';

class LivreurService {
  // Récupérer tous les livreurs
  getAllLivreurs() {
    return axios.get(`${API_URL}/livreurs`, { headers: authHeader() });
  }

  // Importer des livreurs à partir d'un fichier
  importLivreurs(fileData) {
    const formData = new FormData();
    formData.append('file', fileData);
    
    return axios.post(`${API_URL}/livreurs/import`, formData, {
      headers: {
        ...authHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // Ajouter un livreur
  createLivreur(livreur) {
    return axios.post(`${API_URL}/livreurs`, livreur, { headers: authHeader() });
  }

  // Mettre à jour un livreur
  updateLivreur(id, livreur) {
    return axios.put(`${API_URL}/livreurs/${id}`, livreur, { headers: authHeader() });
  }

  // Supprimer un livreur
  deleteLivreur(id) {
    return axios.delete(`${API_URL}/livreurs/${id}`, { headers: authHeader() });
  }
}

export default new LivreurService(); 