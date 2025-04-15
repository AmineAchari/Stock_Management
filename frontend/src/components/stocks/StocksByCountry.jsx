import React, { useState, useEffect } from 'react';
import apiService from '../../services/api.service';
import { format } from 'date-fns';

  const StocksByCountry = ({ pays }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [produits, setProduits] = useState([]);
  const [villes, setVilles] = useState([]);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    loadStocksByCountry();
  }, [pays]);

  const loadStocksByCountry = async () => {
    try {
      setLoading(true);
      setError('');

      // Récupérer les produits par pays
      const response = await apiService.getProduitsByCountry(pays);
      console.log('Données reçues:', response.data);
      
      // Extraire les produits uniques
      const produitsData = response.data.produits || [];
      setProduits(produitsData);
      
      // Extraire les villes uniques
      const villesUniques = Array.from(new Set(produitsData.flatMap(p => 
        p.stocks.map(s => s.ville)
      )));
      setVilles(villesUniques);
      
    } catch (err) {
      console.error('Erreur lors du chargement des stocks par pays:', err);
      setError('Impossible de charger les données des stocks pour ce pays');
    } finally {
      setLoading(false);
    }
  };

  // Formater la date en DD-MM-YY
  const formattedDate = format(currentDate, 'dd-MM-yy');

  // Fonction pour obtenir la quantité d'un produit dans une ville spécifique
  const getQuantityForCity = (produit, ville) => {
    const stockInCity = produit.stocks.find(stock => stock.ville === ville);
    return stockInCity ? stockInCity.quantite : 0;
  };

  return (
    <div className="container-fluid mt-3">
      {/* En-tête avec le pays et la date */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="bg-success text-center py-2 text-white">
            <h5 className="mb-0">{pays} {formattedDate}</h5>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            {/* En-tête du tableau */}
            <thead>
              <tr className="bg-primary text-white">
                <th>Ref</th>
                <th>PRODUITS</th>
                {villes.map(ville => (
                  <th key={ville} className="text-center">{ville}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produits.map(produit => (
                <tr key={produit.id} className={produit.highlight ? "table-warning" : ""}>
                  <td>{produit.reference}</td>
                  <td>{produit.nom}</td>
                  {villes.map(ville => (
                    <td key={ville} className="text-center">
                      {getQuantityForCity(produit, ville)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StocksByCountry; 