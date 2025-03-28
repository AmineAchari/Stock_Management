import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import apiService from "../../services/api.service";

const ProduitDetail = () => {
  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { id } = useParams();

  useEffect(() => {
    fetchProduit();
  }, []);

  const fetchProduit = async () => {
    try {
      const response = await apiService.getProduitById(id);
      setProduit(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors du chargement du produit");
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Détails du produit</h2>

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
      ) : produit ? (
        <div className="card">
          <div className="card-header">
            <h4>{produit.nom}</h4>
          </div>
          <div className="card-body">
            <p>
              <strong>ID:</strong> {produit.id}
            </p>
            <p>
              <strong>Référence:</strong> {produit.reference}
            </p>
            <p>
              <strong>Description:</strong> {produit.description}
            </p>
          </div>
          <div className="card-footer">
            <Link to="/produits" className="btn btn-secondary mr-2">
              Retour
            </Link>
            <Link to={`/produits/edit/${produit.id}`} className="btn btn-warning">
              Modifier
            </Link>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning">Produit non trouvé</div>
      )}
    </div>
  );
};

export default ProduitDetail;