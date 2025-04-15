import React, { useState, useEffect } from 'react';
import AffectationService from '../../services/affectation.service';
import ProduitService from '../../services/produit.service';
import StockService from '../../services/stock.service';

const AffectationProduit = () => {
  const [produits, setProduits] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [quantite, setQuantite] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      ProduitService.getAllProduits(),
      StockService.getAllStocks()
    ])
      .then(([produitsResponse, stocksResponse]) => {
        setProduits(produitsResponse.data);
        setStocks(stocksResponse.data);
        setLoading(false);
      })
      .catch(error => {
        setError('Erreur lors du chargement des données');
        setLoading(false);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedProduit || !selectedStock || !quantite) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      // Vérifier si l'affectation existe déjà
      const response = await AffectationService.verifierAffectationExistante(
        selectedProduit,
        selectedStock
      );

      if (response.data.exists) {
        if (window.confirm('Ce produit est déjà affecté à ce stock. Voulez-vous annuler l\'affectation existante ?')) {
          await AffectationService.annulerAffectation(selectedProduit, selectedStock);
          setSuccess('Affectation existante annulée avec succès');
        } else {
          setError('Opération annulée - Le produit est déjà affecté à ce stock');
        }
        setLoading(false);
        return;
      }

      // Procéder à l'affectation
      const affectation = {
        produitId: selectedProduit,
        stockId: selectedStock,
        quantite: parseInt(quantite)
      };

      await AffectationService.createAffectation(affectation);
      setSuccess('Affectation réussie');
      
      // Reset form
      setSelectedProduit('');
      setSelectedStock('');
      setQuantite('');

    } catch (error) {
      console.error('Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'affectation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header">
          <h5>Affectation des Produits</h5>
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
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="produit" className="form-label">Produit</label>
                <select 
                  className="form-select" 
                  id="produit"
                  value={selectedProduit}
                  onChange={(e) => setSelectedProduit(e.target.value)}
                >
                  <option value="">Sélectionner un produit</option>
                  {produits.map(produit => (
                    <option key={produit.id} value={produit.id}>
                      {produit.nom} ({produit.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="stock" className="form-label">Stock</label>
                <select 
                  className="form-select"
                  id="stock"
                  value={selectedStock}
                  onChange={async (e) => {
                    const stockId = e.target.value;
                    setSelectedStock(stockId);
                    
                    // Vérifier l'affectation si un produit est sélectionné
                    if (selectedProduit && stockId) {
                      try {
                        const response = await AffectationService.verifierAffectationExistante(
                          selectedProduit,
                          stockId
                        );
                        if (response.data.exists) {
                          setError('⚠️ Ce produit est déjà affecté à ce stock');
                        } else {
                          setError('');
                        }
                      } catch (error) {
                        console.error('Erreur de vérification:', error);
                      }
                    }
                  }}
                >
                  <option value="">Sélectionner un stock</option>
                  {stocks.map(stock => (
                    <option key={stock.id} value={stock.id}>
                      {stock.nom} ({stock.ville})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="quantite" className="form-label">Quantité</label>
                <input
                  type="number"
                  className="form-control"
                  id="quantite"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  min="1"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Affecter
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffectationProduit;