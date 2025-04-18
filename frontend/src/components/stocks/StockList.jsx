import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StockService from '../../services/stock.service';
import ImportStocksModal from './ImportStocksModal';

// Composant ActionButton (inchangé)
const ActionButton = ({ icon, label, variant, onClick, title }) => (
  <button
    className={`btn btn-${variant} btn-sm mx-1`}
    onClick={onClick}
    title={title}
  >
    <i className={`fas ${icon} me-1`}></i> {label}
  </button>
);

const StockList = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]); // Données originales
  const [filteredStocks, setFilteredStocks] = useState([]); // Données filtrées pour l'affichage
  const [searchTerm, setSearchTerm] = useState(''); // Terme de recherche
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadStocks();
  }, []);

  // Effet pour filtrer les stocks quand la liste ou le terme de recherche change
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearchTerm) {
      setFilteredStocks(stocks); // Si recherche vide, afficher tout
    } else {
      const filtered = stocks.filter(stock =>
        stock.nom.toLowerCase().includes(lowerCaseSearchTerm) ||
        stock.pays.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredStocks(filtered);
    }
  }, [stocks, searchTerm]); // Dépendances : stocks et searchTerm

  const loadStocks = async () => {
    try {
      setLoading(true);
      setError('');

      const stocksResponse = await StockService.getAllStocks();
      let statsResponse;

      try {
        statsResponse = await StockService.getStockStatistics();
      } catch (statsError) {
        console.error('Error loading statistics:', statsError);
        statsResponse = { data: { statistics: {} } };
      }

      const stocksData = stocksResponse.data;
      const stats = statsResponse.data?.statistics || {};

      const stocksWithStats = stocksData.map(stock => ({
        ...stock,
        statistics: stats[stock.id] || {
          totalProducts: 0,
          lowStockCount: 0,
          zeroStockCount: 0,
          normalStockCount: 0,
          stockStatus: 'EMPTY',
          products: []
        }
      }));

      console.log('Stocks with statistics:', stocksWithStats);
      setStocks(stocksWithStats); // Mettre à jour les données originales
      // setFilteredStocks(stocksWithStats); // Initialiser les données filtrées (sera fait par l'useEffect)
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setError('Erreur lors du chargement des stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmMessage = 'Êtes-vous sûr de vouloir supprimer ce stock ?\n' +
      'Les associations avec les produits seront conservées.';

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        await StockService.deleteStock(id);
        setSuccess('Stock supprimé avec succès. Les associations produits sont conservées.');
        await loadStocks(); // Recharge les données, ce qui mettra à jour 'stocks' et déclenchera le filtre
      } catch (error) {
        console.error('Erreur de suppression:', error);
        setError(`Erreur lors de la suppression: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const generateUniqueKey = (stock, index) => {
    const timestamp = new Date().getTime();
    // Utiliser une clé plus stable si possible, l'ID est généralement suffisant s'il est unique
    return `stock-${stock.id || index}-${timestamp}`;
  };

  const renderStockStatus = (stock) => {
    if (!stock || !stock.statistics) {
      return (
        <div className="d-flex flex-column">
          <span className="text-center">0 produit</span>
        </div>
      );
    }
    const { totalProducts = 0 } = stock.statistics;
    return (
      <div className="d-flex flex-column">
        <span className="text-center">
          {totalProducts} produit{totalProducts > 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  const handleImportSuccess = () => {
    loadStocks(); // Refresh stocks list after successful import
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Liste des Stocks</h5>
          <div>
            {/* ... ActionButtons pour Ajouter et Importer ... */}
            <ActionButton
              icon="fa-plus"
              variant="primary"
              onClick={() => navigate('/stocks/new')}
              title="Ajouter un nouveau stock"
              label="Ajouter"
            />
            <ActionButton
              icon="fa-file-import"
              variant="success"
              onClick={() => setShowImportModal(true)}
              title="Importer des stocks"
              label="Importer"
            />
          </div>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Champ de recherche */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher par nom ou pays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-hover"> {/* Ajout de table-hover */}
                <thead className="table-dark"> {/* Utilisation de table-dark pour l'en-tête */}
                  <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Pays</th>
                    <th>Ville</th>
                    <th>État</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.length === 0 ? ( // Utiliser filteredStocks
                    <tr>
                      <td colSpan="6" className="text-center">
                        {searchTerm ? 'Aucun stock trouvé pour cette recherche' : 'Aucun stock trouvé'}
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((stock, index) => { // Utiliser filteredStocks
                      return (
                        <tr key={generateUniqueKey(stock, index)}>
                          <td>{stock.nom}</td>
                          <td>{stock.typeStock}</td>
                          <td>{stock.pays}</td>
                          <td>{stock.ville}</td>
                          <td>
                            {renderStockStatus(stock)}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm"> {/* Utiliser btn-group pour alignement */}
                              <ActionButton
                                icon="fa-eye"
                                variant="outline-info" // Changer variant en outline-info
                                onClick={() => navigate(`/stocks/${stock.id}`)}
                                title="Voir les détails"
                                label="" // Mettre label à ""
                              />
                              <ActionButton
                                icon="fa-edit"
                                variant="outline-warning" // Garder outline-warning
                                onClick={() => navigate(`/stocks/edit/${stock.id}`)}
                                title="Modifier le stock"
                                label="" // Mettre label à ""
                              />
                              <ActionButton
                                icon="fa-trash"
                                variant="outline-danger" // Garder outline-danger
                                onClick={() => handleDelete(stock.id)}
                                title="Supprimer le stock"
                                label="" // Mettre label à ""
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ImportStocksModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default StockList;
