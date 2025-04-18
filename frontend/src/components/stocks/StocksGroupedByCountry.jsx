import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import apiService from '../../services/api.service';

const StocksGroupedByCountry = () => {
  const [stocksByCountry, setStocksByCountry] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    fetchStocksByCountry();
  }, []);

  const fetchStocksByCountry = async () => {
    try {
      setLoading(true);
      setError(null);
      // Utiliser le service stock ou api selon votre configuration
      const response = await apiService.getStocksByCountry();
      setStocksByCountry(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des stocks par pays:', err);
      setError('Impossible de charger les données des stocks pour ce pays');
    } finally {
      setLoading(false);
    }
  };

  // Formater la date au format français
  const formattedDate = format(currentDate, 'dd MMMM yyyy', { locale: fr });

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-3">
        {error}
        <button 
          className="btn btn-outline-danger ms-3"
          onClick={fetchStocksByCountry}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!stocksByCountry || Object.keys(stocksByCountry).length === 0) {
    return (
      <div className="alert alert-info my-3">
        Aucun stock disponible par pays.
      </div>
    );
  }

  return (
    <div className="stocks-by-country mb-5">
      <h4 className="mb-4">Stocks par pays - {formattedDate}</h4>
      
      {Object.entries(stocksByCountry).map(([country, stocks]) => (
        <div key={country} className="card mb-4 shadow-sm">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">{country} ({stocks.length})</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead className="bg-primary text-white">
                  <tr>
                    <th>Nom</th>
                    <th>Ville</th>
                    <th>Type</th>
                    <th>Adresse</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map(stock => (
                    <tr key={stock.id}>
                      <td>{stock.nom}</td>
                      <td>{stock.ville}</td>
                      <td>{stock.typeStock}</td>
                      <td>{stock.adresse || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
      
      <div className="d-flex justify-content-end mt-3">
        <button className="btn btn-outline-primary" onClick={() => window.print()}>
          <i className="bi bi-printer"></i> Imprimer
        </button>
      </div>
    </div>
  );
};

export default StocksGroupedByCountry; 