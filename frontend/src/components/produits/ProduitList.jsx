import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProduitService from '../../services/produit.service';
import ImportProduitsModal from './ImportProduitsModal';

const ProduitList = () => {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);


  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = () => {
    setLoading(true);
    ProduitService.getAllProduits()
      .then(response => {
        setProduits(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError('Erreur lors du chargement des produits');
        setLoading(false);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      ProduitService.deleteProduit(id)
        .then(() => {
          setSuccess('Produit supprimé avec succès');
          loadProduits();
        })
        .catch(error => {
          setError('Erreur lors de la suppression du produit');
        });
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Liste des Produits</h5>
          <div>
            <button
              className="btn btn-primary btn-sm me-2"
              onClick={() => navigate('/produits/new')}
            >
              ➕ Ajouter un produit
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowImportModal(true)}
            >
              📤 Importer des produits
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center">Aucun produit trouvé</td>
                    </tr>
                  ) : (
                    produits.map(produit => (
                      <tr key={produit.id}>
                        <td>{produit.reference}</td>
                        <td>{produit.nom}</td>
                        <td>{produit.description}</td>
                        <td>
                          <button
                            className="btn btn-outline-primary btn-sm me-2"
                            onClick={() => navigate(`/produits/${produit.id}`)}
                          >
                            Voir
                          </button>
                          <button
                            className="btn btn-outline-warning btn-sm me-2"
                            onClick={() => navigate(`/produits/edit/${produit.id}`)}
                          >
                            Modifier
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(produit.id)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ImportProduitsModal 
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          loadProduits();
          setShowImportModal(false);
        }}
      />
    </div>
  );
};

export default ProduitList;