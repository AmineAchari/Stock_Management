import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StockService from '../../services/stock.service';
import ImportStocksModal from './ImportStocksModal';

// Ajouter le composant ActionButton ici, avant le composant StockList
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
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadStocks();
  }, []);

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

      const stocks = stocksResponse.data;
      const stats = statsResponse.data?.statistics || {};

      const stocksWithStats = stocks.map(stock => ({
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
      setStocks(stocksWithStats);
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
        await loadStocks();
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
    const sanitizedName = stock.nom.replace(/[^a-z0-9]/gi, '-');
    return `stock-${stock.id}-${sanitizedName}-${index}-${timestamp}`;
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
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Pays</th>
                    <th>Ville</th>
                    <th>État</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">Aucun stock trouvé</td>
                    </tr>
                  ) : (
                    stocks.map((stock, index) => {
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
                            <div className="d-flex align-items-center">
                              <ActionButton
                                icon="fa-eye"
                                variant="primary"
                                onClick={() => navigate(`/stocks/${stock.id}`)}
                                title="Voir les détails"
                                label="Voir"
                              />
                              <ActionButton
                                icon="fa-edit"
                                variant="warning"
                                onClick={() => navigate(`/stocks/edit/${stock.id}`)}
                                title="Modifier le stock"
                                label="Modifier"
                              />
                              <ActionButton
                                icon="fa-trash"
                                variant="danger"
                                onClick={() => handleDelete(stock.id)}
                                title="Supprimer le stock"
                                label="Supprimer"
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