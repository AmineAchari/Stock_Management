import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiService from "../../services/api.service";

const StockList = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await apiService.getAllStocks();
      setStocks(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors du chargement des stocks");
      setLoading(false);
    }
  };

  const deleteStock = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce stock?")) {
      try {
        await apiService.deleteStock(id);
        fetchStocks();
        setMessage("Stock supprimé avec succès");
      } catch (error) {
        console.error("Erreur:", error);
        setMessage("Erreur lors de la suppression du stock: " + error.response?.data?.message || error.message);
      }
    }
  };

  return (
    <div className="container">
      <h2>Liste des stocks</h2>
      <Link to="/stocks/new" className="btn btn-primary mb-3">
        Ajouter un stock
      </Link>

      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Chargement...</span>
          </div>
        </div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Adresse</th>
              <th>Ville</th>
              <th>Pays</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.id}>
                <td>{stock.id}</td>
                <td>{stock.nom}</td>
                <td>{stock.adresse}</td>
                <td>{stock.ville}</td>
                <td>{stock.pays}</td>
                <td>{stock.typeStock}</td>
                <td>
                  <Link
                    to={`/stocks/${stock.id}`}
                    className="btn btn-info btn-sm mr-2"
                  >
                    Détails
                  </Link>
                  <Link
                    to={`/stocks/edit/${stock.id}`}
                    className="btn btn-warning btn-sm mr-2"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => deleteStock(stock.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StockList;