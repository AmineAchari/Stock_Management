import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AffectationService from '../../services/affectation.service';
import StockService from '../../services/stock.service';

const ProduitAffectations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const tooltipRefs = useRef([]);

  useEffect(() => {
    loadAffectations();
  }, [id]);

  useEffect(() => {
    // Initialiser les tooltips après le rendu
    if (tooltipRefs.current.length > 0) {
      tooltipRefs.current.forEach(ref => {
        if (ref) {
          const tooltip = new window.bootstrap.Tooltip(ref);
          return () => tooltip.dispose();
        }
      });
    }
  }, [affectations]);

  const loadAffectations = () => {
    setLoading(true);
    setError('');
    setSuccess('');
    AffectationService.getAffectationsByProduit(id)
      .then(response => {
        setAffectations(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.response?.data?.message || 'Erreur lors du chargement des affectations');
        setLoading(false);
      });
  };

  const handleAnnulerAffectation = (produitId, stockId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette affectation ?')) {
      setError('');
      setSuccess('');
      AffectationService.annulerAffectation(produitId, stockId)
        .then(response => {
          if (response.data.success) {
            setSuccess(response.data.message);
            loadAffectations();
          } else {
            setError(response.data.message);
          }
        })
        .catch(error => {
          if (error.response?.data?.message) {
            setError(error.response.data.message);
          } else if (error.response?.status === 401) {
            setError('Vous n\'êtes pas autorisé à effectuer cette action');
          } else if (error.response?.status === 404) {
            setError('Ressource non trouvée');
          } else {
            setError('Une erreur est survenue lors de l\'annulation de l\'affectation');
          }
        });
    }
  };

  const handleAnnulerToutesAffectations = () => {
    if (affectations.length === 0) {
      setError('Aucune affectation à annuler');
      return;
    }

    const confirmationMessage = `Êtes-vous sûr de vouloir annuler toutes les affectations (${affectations.length}) ?\n\nStocks concernés :\n${affectations.map(a => `- ${a.stock.nom} (${a.stock.ville})`).join('\n')}`;

    if (window.confirm(confirmationMessage)) {
      setLoading(true);
      setError('');
      setSuccess('');

      // Annuler chaque affectation une par une
      const promises = affectations.map(affectation => 
        AffectationService.annulerAffectation(affectation.produit.id, affectation.stock.id)
      );

      Promise.all(promises)
        .then(responses => {
          const allSuccess = responses.every(response => response.data.success);
          if (allSuccess) {
            setSuccess('Toutes les affectations ont été annulées avec succès');
            loadAffectations();
          } else {
            const errorMessages = responses
              .filter(response => !response.data.success)
              .map(response => response.data.message);
            setError(`Erreurs lors de l'annulation : ${errorMessages.join(', ')}`);
          }
        })
        .catch(error => {
          if (error.response?.data?.message) {
            setError(error.response.data.message);
          } else if (error.response?.status === 401) {
            setError('Vous n\'êtes pas autorisé à effectuer cette action');
          } else if (error.response?.status === 404) {
            setError('Ressource non trouvée');
          } else {
            setError('Une erreur est survenue lors de l\'annulation des affectations');
          }
          setLoading(false);
        });
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Affectations du Produit</h5>
          <div>
            <button 
              className="btn btn-outline-danger btn-sm me-2"
              onClick={handleAnnulerToutesAffectations}
              disabled={affectations.length === 0}
            >
              Annuler toutes les affectations
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate('/produits')}
            >
              Retour à la liste
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError('')}
                aria-label="Close"
              ></button>
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {success}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSuccess('')}
                aria-label="Close"
              ></button>
            </div>
          )}
          
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
                    <th>Stock</th>
                    <th>Ville</th>
                    <th>Type</th>
                    <th>Quantité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affectations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">Aucune affectation trouvée</td>
                    </tr>
                  ) : (
                    affectations.map(affectation => (
                      <tr key={affectation.id}>
                        <td>{affectation.stock.nom}</td>
                        <td>{affectation.stock.ville}</td>
                        <td>{affectation.stock.type}</td>
                        <td>{affectation.quantite}</td>
                        <td>
                          <button 
                            ref={el => tooltipRefs.current.push(el)}
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleAnnulerAffectation(affectation.produit.id, affectation.stock.id)}
                            title="Annuler l'affectation"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                          >
                            <i className="bi bi-x-circle"></i> Annuler
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
    </div>
  );
};

export default ProduitAffectations; 