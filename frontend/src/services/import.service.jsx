import axios from "axios";
import authHeader from "./auth-header";

const API_URL_IMPORT = "http://localhost:8080/api/import";
const API_URL = "http://localhost:8080/api";

class ImportService {
  /**
   * Importe un fichier Excel des livraisons avec validation améliorée
   */
  async importLivraisons(file, options = {}) {
    console.log('=== DÉBUT IMPORT LIVRAISONS ===');
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add options to formData
    Object.entries(options).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    try {
      console.log('📤 Envoi de la requête...');
      const response = await axios.post(`${API_URL}/import/livraisons`, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('=== RÉSULTAT IMPORT ===');
      console.log('Status:', response.status);
      console.log('Données:', response.data);
      
      return response;
    } catch (error) {
      console.error('=== ERREUR IMPORT ===', error);
      throw error;
    } finally {
      console.log('=== FIN IMPORT LIVRAISONS ===\n');
    }
  }

  /**
   * Vérifie la présence d'un produit dans un stock
   */
  async verifierProduitDansStock(produitId, stockId) {
    try {
      const response = await axios.get(`${API_URL}/stocks/${stockId}/produits/${produitId}`, {
        headers: authHeader()
      });
      return response.data?.quantite > 0;
    } catch {
      return false;
    }
  }

  /**
   * Importe un fichier Excel des produits
   * @param {File} file - Le fichier Excel à importer (.xlsx ou .xls)
   * @returns {Promise} Promesse avec le résultat de l'importation
   */
  async importProduits(file) {
    console.log('=== DÉBUT IMPORT PRODUITS ===');
    console.log('Fichier:', file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log('Envoi de la requête...');
      const response = await axios.post(`${API_URL}/produits/import`, formData, {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log('=== RÉSULTAT IMPORT ===');
      console.log('Status:', response.status);
      console.log('Données:', response.data);
      
      return response;
    } catch (error) {
      console.error('=== ERREUR IMPORT ===');
      console.error('Type:', error.name);
      console.error('Message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Données:', error.response.data);
      }
      throw error;
    } finally {
      console.log('=== FIN IMPORT PRODUITS ===\n');
    }
  }
  
  /**
   * Récupère l'historique des importations
   * @returns {Promise} Promesse avec l'historique des importations
   */
  getHistoriqueImportations() {
    return axios.get(API_URL_IMPORT + "/livraisons/historique", { 
      headers: authHeader() 
    });
  }
}

const importService = new ImportService();
export default importService;