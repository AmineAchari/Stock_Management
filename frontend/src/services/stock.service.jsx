import axios from "axios";
import authHeader from "./auth-header";

const API_URL = 'http://localhost:8080/api';

class StockService {
  getAllStocks() {
    return axios.get(`${API_URL}/stocks`, { headers: authHeader() });
  }

  getStockById(id) {
    return axios.get(`${API_URL}/stocks/${id}`, { headers: authHeader() });
  }

  createStock(stock) {
    return axios.post(`${API_URL}/stocks`, stock, { headers: authHeader() });
  }

  updateStock(id, stock) {
    return axios.put(`${API_URL}/stocks/${id}`, stock, { headers: authHeader() });
  }

  deleteStock(id) {
    return axios.delete(`${API_URL}/stocks/${id}`, { headers: authHeader() });
  }

  getStockProduits(id) {
    return axios.get(`${API_URL}/stocks/${id}/produits`, { headers: authHeader() });
  }

  // Récupérer les stocks groupés par pays
  getStocksByCountry() {
    return axios.get(`${API_URL}/stocks/by-country`, { headers: authHeader() });
  }

  getStockStatistics() {
    return axios.get(`${API_URL}/produit-stock/statistics`, {
      headers: authHeader()
    });
  }

  exportStockDetails(stockId) {
    return axios.get(`${API_URL}/stocks/export/${stockId}`, {
      headers: {
        ...authHeader(),
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'blob'
    });
  }

  importStocks(file) {
    const formData = new FormData();
    formData.append('file', file);

    return axios.post(`${API_URL}/import/stocks`, formData, {
      headers: {
        ...authHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}

// Création d'une instance nommée avant export
const stockService = new StockService();
export default stockService;