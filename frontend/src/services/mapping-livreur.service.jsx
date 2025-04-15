import axios from "axios";
import authHeader from "./auth-header";

const API_URL = "http://localhost:8080/api/mapping-livreur";

class MappingLivreurService {
  /**
   * Récupérer tous les mappings de livreurs
   * @returns {Promise} Liste des mappings
   */
  getAllMappings() {
    return axios.get(API_URL, { headers: authHeader() });
  }

  /**
   * Récupérer un mapping par son ID
   * @param {number} id - ID du mapping
   * @returns {Promise} Détails du mapping
   */
  getMappingById(id) {
    return axios.get(`${API_URL}/${id}`, { headers: authHeader() });
  }

  /**
   * Créer un nouveau mapping
   * @param {Object} mapping - Données du mapping à créer
   * @returns {Promise} Mapping créé
   */
  createMapping(mapping) {
    return axios.post(API_URL, mapping, { headers: authHeader() });
  }

  /**
   * Mettre à jour un mapping existant
   * @param {number} id - ID du mapping à modifier
   * @param {Object} mapping - Données mises à jour
   * @returns {Promise} Mapping modifié
   */
  updateMapping(id, mapping) {
    return axios.put(`${API_URL}/${id}`, mapping, { headers: authHeader() });
  }

  /**
   * Supprimer un mapping
   * @param {number} id - ID du mapping à supprimer
   * @returns {Promise} Résultat de la suppression
   */
  deleteMapping(id) {
    return axios.delete(`${API_URL}/${id}`, { headers: authHeader() });
  }

  /**
   * Rechercher un mapping spécifique
   * @param {string} nomLivreur - Nom du livreur
   * @param {string} prestataire - Nom du prestataire
   * @param {string} ville - Ville
   * @returns {Promise} Mapping correspondant
   */
  searchMapping(nomLivreur, prestataire, ville) {
    return axios.get(`${API_URL}/search`, {
      headers: authHeader(),
      params: { nomLivreur, prestataire, ville }
    });
  }

  /**
   * Importer des mappings depuis un fichier Excel
   * @param {File} file - Fichier Excel contenant les mappings
   * @returns {Promise} Résultat de l'importation
   */
  importMappings(file) {
    const formData = new FormData();
    formData.append("file", file);
    
    return axios.post(`${API_URL}/import`, formData, {
      headers: {
        ...authHeader(),
        "Content-Type": "multipart/form-data"
      }
    });
  }
}

export default new MappingLivreurService(); 