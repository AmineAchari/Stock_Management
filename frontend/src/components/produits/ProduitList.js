import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiService from "../../services/api.service";

const ProduitList = () => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      const response = await apiService.getAllProduits();
      setProduits(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors du chargement des produits");
      setLoading(false);
    }
  };

  const deleteProduit = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
      try {
        await apiService.deleteProduit(id);
        fetchProduits();
        setMessage("Produit supprimé avec succès");
      } catch (error) {
        setMessage("Erreur lors de la suppression du produit");
      }
    }
  };

  return (
    <div className="container">
      <h2>Liste des produits</h2>
      <Link to="/produits/new" className="btn btn-primary mb-3">
        Ajouter un produit
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
              <th>Référence</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((produit) => (
              <tr key={produit.id}>
                <td>{produit.id}</td>
                <td>{produit.nom}</td>
                <td>{produit.reference}</td>
                <td>{produit.description}</td>
                <td>
                  <Link
                    to={`/produits/${produit.id}`}
                    className="btn btn-info btn-sm mr-2"
                  >
                    Détails
                  </Link>
                  <Link
                    to={`/produits/edit/${produit.id}`}
                    className="btn btn-warning btn-sm mr-2"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => deleteProduit(produit.id)}
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

export default ProduitList;