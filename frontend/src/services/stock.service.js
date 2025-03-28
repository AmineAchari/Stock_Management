import axios from "axios";
import authHeader from "./auth-header";


// Utiliser la même instance axios que dans produit.service.js
const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 5000,
});

// Fonction pour obtenir la configuration à jour (même que produit.service.js)
const getConfig = () => {
  const headers = {
    ...authHeader(),
    'Content-Type': 'application/json'
  };
  
  return {
    headers,
    withCredentials: false
  };
};

class StockService {
  getAllStocks() {
    return axiosInstance.get("/api/stocks/", getConfig());
  }

  getStockById(id) {
    return axiosInstance.get(`/api/stocks/${id}`, getConfig());
  }

  createStock(stock) {
    return axiosInstance.post("/api/stocks/", stock, getConfig());
  }

  updateStock(id, stock) {
    return axiosInstance.put(`/api/stocks/${id}`, stock, getConfig());
  }

  deleteStock(id) {
    return axiosInstance.delete(`/api/stocks/${id}`, getConfig());
  }
}

// Création d'une instance nommée avant export
const stockService = new StockService();
export default stockService;