import React, { useState, useEffect } from 'react';
import StockService from '../../services/stock.service';
import ProduitService from '../../services/produit.service';
import MappingLivreurService from '../../services/mapping-livreur.service';
import { Link } from 'react-router-dom'; // Pour les liens

// Composant simple pour une carte KPI
const KpiCard = ({ title, value, icon, linkTo, loading, error }) => (
  <div className="col-md-6 col-lg-3 mb-4">
    <div className={`card shadow-sm h-100 ${error ? 'border-danger' : ''}`}>
      <div className="card-body d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-between align-items-start">
            <h6 className="card-subtitle mb-2 text-muted">{title}</h6>
            {icon && <i className={`fas ${icon} fa-2x text-muted opacity-50`}></i>}
          </div>
          {loading ? (
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : error ? (
             <p className="card-text fs-4 text-danger" title={error}>Erreur</p>
          ) : (
            <p className="card-text fs-4">{value}</p>
          )}
        </div>
        {linkTo && !loading && !error && (
          <Link to={linkTo} className="btn btn-sm btn-outline-primary mt-2 align-self-start">
            Voir plus <i className="fas fa-arrow-right ms-1"></i>
          </Link>
        )}
         {error && (
           <small className="text-danger mt-2">{error.substring(0, 50)}...</small> // Affiche début de l'erreur
         )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stockCount, setStockCount] = useState(0);
  const [produitCount, setProduitCount] = useState(0);
  const [livreurCount, setLivreurCount] = useState(0);
  // Ajoutez des états pour le chargement et les erreurs par KPI
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [loadingProduits, setLoadingProduits] = useState(true);
  const [loadingLivreurs, setLoadingLivreurs] = useState(true);
  const [errorStocks, setErrorStocks] = useState('');
  const [errorProduits, setErrorProduits] = useState('');
  const [errorLivreurs, setErrorLivreurs] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Stock Count
      try {
        setLoadingStocks(true);
        setErrorStocks('');
        // Idéalement, utiliser une API qui renvoie juste le compte
        const response = await StockService.getAllStocks();
        setStockCount(response.data.length);
      } catch (err) {
        console.error("Erreur chargement stocks:", err);
        setErrorStocks('Chargement impossible');
      } finally {
        setLoadingStocks(false);
      }

      // Fetch Produit Count
      try {
        setLoadingProduits(true);
        setErrorProduits('');
        // Idéalement, utiliser une API qui renvoie juste le compte
        const response = await ProduitService.getAllProduits();
        setProduitCount(response.data.length);
      } catch (err) {
         console.error("Erreur chargement produits:", err);
         setErrorProduits('Chargement impossible');
      } finally {
        setLoadingProduits(false);
      }

      // Fetch Livreur Count
      try {
         setLoadingLivreurs(true);
         setErrorLivreurs('');
         // Idéalement, utiliser une API qui renvoie juste le compte
         const response = await MappingLivreurService.getAllMappings();
         setLivreurCount(response.data.length);
      } catch (err) {
         console.error("Erreur chargement livreurs:", err);
         setErrorLivreurs('Chargement impossible');
      } finally {
         setLoadingLivreurs(false);
      }
    };

    fetchData();
  }, []); // Le tableau vide assure que cela s'exécute une seule fois au montage

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Tableau de Bord</h2>

      <div className="row">
        <KpiCard
          title="Nombre de Stocks"
          value={stockCount}
          icon="fa-warehouse"
          linkTo="/stocks"
          loading={loadingStocks}
          error={errorStocks}
        />
        <KpiCard
          title="Nombre de Produits"
          value={produitCount}
          icon="fa-tags"
          linkTo="/produits"
          loading={loadingProduits}
          error={errorProduits}
        />
        <KpiCard
          title="Nombre de Livreurs"
          value={livreurCount}
          icon="fa-truck"
          linkTo="/mapping-livreurs"
          loading={loadingLivreurs}
          error={errorLivreurs}
        />
        {/* Ajoutez d'autres KpiCard ici si nécessaire */}
        {/* Exemple: Produits en alerte (nécessiterait une API spécifique) */}
        {/* <KpiCard title="Produits en Alerte" value={alertCount} icon="fa-exclamation-triangle" linkTo="/rapports/alertes" /> */}

      </div>

      {/* Section pour les graphiques (à ajouter plus tard) */}
      {/*
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Répartition des Stocks par Type</h5>
              {/* Composant Graphique ici (ex: avec Chart.js) */}
            {/*</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Produits en Alerte</h5>
              {/* Autre Composant Graphique ou Liste */}
            {/*</div>
          </div>
        </div>
      </div>
      */}

    </div>
  );
};

export default Dashboard;
