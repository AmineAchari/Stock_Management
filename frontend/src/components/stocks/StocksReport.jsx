import React, { useState, useEffect } from 'react';
import apiService from '../../services/api.service';
import StocksByCountry from './StocksByCountry';
import StocksGroupedByCountry from './StocksGroupedByCountry';

const StocksReport = () => {
  const [loading, setLoading] = useState(false);
  const [pays, setPays] = useState([]);
  const [selectedPays, setSelectedPays] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('produits'); // 'produits' ou 'stocks'

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      // Récupérer la liste des pays depuis l'API
      const response = await apiService.getAllStocks();
      // Extraire les pays uniques
      const uniqueCountries = Array.from(
        new Set(response.data.map(stock => stock.pays))
      ).filter(Boolean); // Filtrer les valeurs null/undefined/empty
      
      setPays(uniqueCountries);
      
      // Sélectionner le premier pays par défaut s'il existe
      if (uniqueCountries.length > 0) {
        setSelectedPays(uniqueCountries[0]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des pays:', err);
      setError('Impossible de charger la liste des pays');
    } finally {
      setLoading(false);
    }
  };

  const handlePaysChange = (event) => {
    setSelectedPays(event.target.value);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Rapport des Stocks par Pays</h4>
          <div className="d-flex">
            {activeTab === 'produits' && (
              <select 
                className="form-select me-2" 
                value={selectedPays} 
                onChange={handlePaysChange}
                disabled={loading}
              >
                {pays.length === 0 ? (
                  <option value="">Chargement des pays...</option>
                ) : (
                  pays.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))
                )}
              </select>
            )}
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={handlePrint}
              disabled={activeTab === 'produits' && !selectedPays}
            >
              <i className="bi bi-printer"></i> Imprimer
            </button>
          </div>
        </div>
        
        <div className="card-body">
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'produits' ? 'active' : ''}`}
                onClick={() => handleTabChange('produits')}
              >
                Produits par pays
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'stocks' ? 'active' : ''}`}
                onClick={() => handleTabChange('stocks')}
              >
                Stocks par pays
              </button>
            </li>
          </ul>
          
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {activeTab === 'produits' && selectedPays && (
            <StocksByCountry pays={selectedPays} />
          )}
          
          {activeTab === 'stocks' && (
            <StocksGroupedByCountry />
          )}
        </div>
      </div>
    </div>
  );
};

export default StocksReport; 