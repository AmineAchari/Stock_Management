import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api.service";

const StockForm = () => {
  const initialStockState = {
    nom: "",
    adresse: "",
    ville: "",
    pays: "",
    typeStock: "ENTREPOT"
  };

  const [stock, setStock] = useState(initialStockState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id && id !== "new") {
      setIsEdit(true);
      fetchStock(id);
    }
  }, [id]);

  const fetchStock = async (id) => {
    try {
      const response = await apiService.getStockById(id);
      setStock(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors du chargement du stock");
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setStock({ ...stock, [name]: value });
  };

  const saveStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let response;
      if (isEdit) {
        response = await apiService.updateStock(id, stock);
        setMessage("Le stock a été mis à jour avec succès!");
        window.dispatchEvent(new CustomEvent('stock-updated', { 
          detail: { stockId: id } 
        }));
      } else {
        response = await apiService.createStock(stock);
        setMessage("Le stock a été créé avec succès!");
      }
      setTimeout(() => {
        navigate("/stocks");
      }, 1500);
    } catch (error) {
      console.error("Erreur:", error);
      const resMessage = error.response?.data?.message || error.message || "Une erreur est survenue";
      setMessage(resMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleStockUpdate = () => {
      fetchStock(id);
    };
    
    window.addEventListener('stock-updated', handleStockUpdate);
    return () => {
      window.removeEventListener('stock-updated', handleStockUpdate);
    };
  }, [id]);

  return (
    <div className="container">
      <h2>{isEdit ? "Modifier le stock" : "Ajouter un stock"}</h2>

      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      <form onSubmit={saveStock}>
        <div className="form-group">
          <label htmlFor="nom">Nom</label>
          <input
            type="text"
            className="form-control"
            id="nom"
            name="nom"
            value={stock.nom}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="adresse">Adresse</label>
          <input
            type="text"
            className="form-control"
            id="adresse"
            name="adresse"
            value={stock.adresse}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="ville">Ville</label>
          <input
            type="text"
            className="form-control"
            id="ville"
            name="ville"
            value={stock.ville}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pays">Pays</label>
          <input
            type="text"
            className="form-control"
            id="pays"
            name="pays"
            value={stock.pays}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="typeStock">Type de stock</label>
          <select
            className="form-control"
            id="typeStock"
            name="typeStock"
            value={stock.typeStock}
            onChange={handleInputChange}
            required
          >
            <option value="ENTREPOT">ENTREPOT</option>
            <option value="REPRESENTANT">REPRESENTANT</option>
            <option value="PRESTATAIRE">PRESTATAIRE</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            "Enregistrer"
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

export default StockForm;