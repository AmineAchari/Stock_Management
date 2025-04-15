import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import apiService from "../../services/api.service";
import stockService from "../../services/stock.service";

const StockDetail = () => {
  const [stock, setStock] = useState(null);
  const [produits, setProduits] = useState([]);
  const [produitsAvecNoms, setProduitsAvecNoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [produitsLoading, setProduitsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { id } = useParams();
  
  // États pour l'édition de quantité
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nouvelleQuantite, setNouvelleQuantite] = useState(0);
  
  // Charger tous les produits pour obtenir leurs noms
  const [allProduits, setAllProduits] = useState([]);
  
  const fetchAllProduits = useCallback(async () => {
    try {
      const response = await apiService.getAllProduits();
      console.log("Tous les produits:", response.data);
      setAllProduits(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement de tous les produits:", error);
    }
  }, []);

  const fetchStock = useCallback(async () => {
    try {
      const response = await apiService.getStockById(id);
      setStock(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors du chargement du stock");
      setLoading(false);
    }
  }, [id]);

  const fetchProduitsByStock = useCallback(async () => {
    try {
      setProduitsLoading(true);
      console.log("Récupération des produits pour le stock ID:", id);
      const response = await apiService.getProduitsByStock(id);
      
      // Store raw product data
      const rawProduits = response.data;
      console.log("Données brutes reçues:", rawProduits);

      // Map the products with complete information
      const produitsProcessed = rawProduits.map(item => {
        // Handle nested product object structure
        const produitData = item.produit || item;
        return {
          id: produitData.id,
          nom: produitData.nom,
          reference: produitData.reference,
          quantite: item.quantite || produitData.quantite || 0,
          seuilAlerte: produitData.seuilAlerte
        };
      });

      console.log("Produits traités:", produitsProcessed);
      setProduits(produitsProcessed);
      setProduitsAvecNoms(produitsProcessed); // Set initial data
      
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    } finally {
      setProduitsLoading(false);
    }
  }, [id]);
  
  // Enrichir les produits avec leurs noms
  useEffect(() => {
    if (produits.length > 0 && allProduits.length > 0) {
      const produitsEnrichis = produits.map(p => {
        const produitInfo = allProduits.find(ap => ap.id === p.id);
        if (!produitInfo) {
          console.warn(`Produit non trouvé dans la liste complète: ID=${p.id}`);
          return p; // Return original data if not found
        }
        return {
          ...p,
          nom: produitInfo.nom || p.nom, // Keep original name if exists
          reference: produitInfo.reference || p.reference // Keep original reference if exists
        };
      });
      console.log("Produits enrichis:", produitsEnrichis);
      setProduitsAvecNoms(produitsEnrichis);
    }
  }, [produits, allProduits]);

  useEffect(() => {
    fetchStock();
    fetchProduitsByStock();
    fetchAllProduits(); // Charger tous les produits pour les noms
  }, [fetchStock, fetchProduitsByStock, fetchAllProduits]);


  // Ajout d'une fonction pour rafraîchir les produits
  const handleRefreshProduits = () => {
    fetchProduitsByStock();
    setMessage("Rafraîchissement des produits...");
    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  const handleEdit = (produit) => {
    setEditMode(true);
    setEditingId(produit.id);
    setNouvelleQuantite(produit.quantite);
  };
  
  const handleSave = async (produitId) => {
    try {
      setMessage("Modification en cours...");
      await apiService.modifierQuantite(produitId, id, nouvelleQuantite);
      setEditMode(false);
      setEditingId(null);
      setMessage("Quantité modifiée avec succès!");
      // Rafraîchir les données
      fetchProduitsByStock();
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la modification de la quantité:", error);
      setMessage("Erreur lors de la modification: " + (error.response?.data?.message || error.message));
    }
  };
  
  const handleCancel = () => {
    setEditMode(false);
    setEditingId(null);
  };

  const handleExport = async () => {
    try {
      setMessage("Exportation en cours...");

      const response = await stockService.exportStockDetails(id);

      // Créer le blob
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Créer l'URL et le lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Générer le nom du fichier
      const today = new Date().toISOString().split('T')[0];
      const filename = `stock_${stock.nom}_${today}.xlsx`;
      link.setAttribute('download', filename);

      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();

      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage("Export réussi!");
      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      setMessage("Erreur lors de l'exportation du fichier");
    }
  };

  return (
    <div className="container">
      <h2>Détails du stock</h2>

      {message && (
        <div className="alert alert-info py-2" role="alert">
          {message}
        </div>
      )}

      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Chargement...</span>
          </div>
        </div>
      ) : stock ? (
        <div className="card">
          <div className="card-header py-1 d-flex align-items-center">
            <h5 className="mb-0">{stock.nom}</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>ID:</strong> {stock.id}
                </p>
                <p className="mb-1">
                  <strong>Adresse:</strong> {stock.adresse}
                </p>
                <p className="mb-1">
                  <strong>Ville:</strong> {stock.ville}
                </p>
              </div>
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>Pays:</strong> {stock.pays}
                </p>
                <p className="mb-1">
                  <strong>Type de stock:</strong> {stock.typeStock}
                </p>
              </div>
            </div>
            
            <h5 className="mt-3 d-flex align-items-center">
              <span>Produits dans ce stock</span>
              <button 
                onClick={handleRefreshProduits} 
                className="btn btn-outline-secondary btn-sm ms-2 py-0"
                disabled={produitsLoading}
              >
                {produitsLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <span>Rafraîchir</span>
                )}
              </button>
            </h5>
            
            {produitsLoading ? (
              <div className="text-center my-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="sr-only">Chargement des produits...</span>
                </div>
              </div>
            ) : produitsAvecNoms.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Référence</th>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produitsAvecNoms.map((ps) => (
                      <tr key={ps.id || `prod-${ps.id}`}>
                        <td>{ps.reference}</td>
                        <td>{ps.nom}</td>
                        <td>
                          {editMode && editingId === ps.id ? (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min="0"
                              value={nouvelleQuantite}
                              onChange={(e) => setNouvelleQuantite(parseInt(e.target.value) || 0)}
                              style={{width: '80px'}}
                            />
                          ) : (
                            <span className={`badge ${ps.quantite > 10 ? 'bg-success' : 'bg-warning'}`}>
                              {ps.quantite}
                            </span>
                          )}
                        </td>
                        <td>
                          {editMode && editingId === ps.id ? (
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleSave(ps.id)}
                                title="Enregistrer"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleCancel}
                                title="Annuler"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <div className="btn-group" role="group">
                              <Link 
                                to={`/produits/${ps.id}`} 
                                className="btn btn-info btn-sm"
                                title="Voir les détails"
                              >
                                <i className="fas fa-eye"></i>
                              </Link>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleEdit(ps)}
                                title="Modifier la quantité"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="3"><strong>Total des produits</strong></td>
                      <td>
                        <strong>
                          {produitsAvecNoms.reduce((total, ps) => total + (ps.quantite || 0), 0)}
                        </strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Aucun produit dans ce stock. 
                <Link to="/affectation" className="btn btn-primary btn-sm ms-2">
                  <i className="fas fa-plus me-1"></i>
                  Affecter un produit
                </Link>
              </div>
            )}
          </div>
          <div className="card-footer py-2 d-flex justify-content-between">
            <div className="btn-group btn-group-sm">
              <Link to="/stocks" className="btn btn-secondary">
                Retour
              </Link>
              <Link to={`/stocks/edit/${stock.id}`} className="btn btn-warning">
                Modifier
              </Link>
              <Link to="/affectation" className="btn btn-primary">
                Affecter un produit
              </Link>
            </div>
            <button 
              className="btn btn-success btn-sm"
              onClick={handleExport}
              disabled={produitsLoading || produitsAvecNoms.length === 0}
            >
              <i className="fas fa-file-excel me-1"></i>
              Exporter Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning">Stock non trouvé</div>
      )}
    </div>
  );
};

export default StockDetail;