import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api.service";

const AffectationForm = () => {
  const [produits, setProduits] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [produitId, setProduitId] = useState("");
  const [stockId, setStockId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduits();
    fetchStocks();
  }, []);

  const fetchProduits = async () => {
    try {
      const response = await apiService.getAllProduits();
      setProduits(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors du chargement des produits");
    }
  };

  const fetchStocks = async () => {
    try {
      const response = await apiService.getAllStocks();
      setStocks(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors du chargement des stocks");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      console.log("Affectation du produit", produitId, "au stock", stockId, "avec quantité", quantite);
      const response = await apiService.affecterProduit(produitId, stockId, quantite);
      console.log("Réponse d'affectation:", response);
      
      setMessage("Produit affecté au stock avec succès!");
      
      // Forcer l'utilisateur à cliquer sur un bouton pour rediriger
      // Ce délai permet au backend de traiter complètement l'affectation
      setTimeout(() => {
        setMessage("Produit affecté au stock avec succès! Redirection vers le stock...");
        setTimeout(() => {
          navigate(`/stocks/${stockId}`);
        }, 1000);
      }, 1500);
    } catch (error) {
      console.error("Erreur d'affectation:", error);
      console.error("Détails de l'erreur:", error.response?.data);
      const resMessage = error.response?.data?.message || error.message || "Une erreur est survenue";
      setMessage(resMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Affecter un produit à un stock</h2>

      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="produitId">Produit</label>
          <select
            className="form-control"
            id="produitId"
            value={produitId}
            onChange={(e) => setProduitId(e.target.value)}
            required
          >
            <option value="">Sélectionnez un produit</option>
            {produits.map((produit) => (
              <option key={produit.id} value={produit.id}>
                {produit.nom} ({produit.reference})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="stockId">Stock</label>
          <select
            className="form-control"
            id="stockId"
            value={stockId}
            onChange={(e) => setStockId(e.target.value)}
            required
          >
            <option value="">Sélectionnez un stock</option>
            {stocks.map((stock) => (
              <option key={stock.id} value={stock.id}>
                {stock.nom} ({stock.ville}, {stock.pays})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quantite">Quantité</label>
          <input
            type="number"
            className="form-control"
            id="quantite"
            min="1"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            "Affecter"
          )}
        </button>
        <button
          type="button"
          className="btn btn-secondary ml-2"
          onClick={() => navigate("/stocks")}
        >
          Annuler
        </button>
      </form>
    </div>
  );
};

export default AffectationForm;