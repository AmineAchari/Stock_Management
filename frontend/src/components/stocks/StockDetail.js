import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import apiService from "../../services/api.service";

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
      console.log("Début de la récupération des produits pour le stock ID:", id);
      const response = await apiService.getProduitsByStock(id);
      console.log("Réponse de l'API getProduitsByStock:", response);
      console.log("Données reçues:", response.data);
      console.log("Nombre de produits récupérés:", response.data ? response.data.length : 0);
      
      // Si les données sont dans un format différent, les transformer
      const produitsFormatted = Array.isArray(response.data) ? response.data.map(ps => {
        console.log("Traitement du produit:", ps);
        return renderProduitInfo(ps);
      }) : [];
      
      setProduits(produitsFormatted);
      setProduitsLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      setProduitsLoading(false);
    }
  }, [id]);
  
  // Enrichir les produits avec leurs noms
  useEffect(() => {
    if (produits.length > 0 && allProduits.length > 0) {
      const produitsEnrichis = produits.map(p => {
        const produitInfo = allProduits.find(ap => ap.id === p.id);
        return {
          ...p,
          nom: produitInfo ? produitInfo.nom : `Produit ${p.id}`,
          reference: produitInfo ? produitInfo.reference : `REF-${p.id}`
        };
      });
      setProduitsAvecNoms(produitsEnrichis);
    } else {
      setProduitsAvecNoms(produits);
    }
  }, [produits, allProduits]);

  useEffect(() => {
    fetchStock();
    fetchProduitsByStock();
    fetchAllProduits(); // Charger tous les produits pour les noms
  }, [fetchStock, fetchProduitsByStock, fetchAllProduits]);

  const renderProduitInfo = (ps) => {
    console.log("Données reçues pour le produit:", ps);
    
    // Format 1: objet ProduitStock avec un produit imbriqué
    if (ps.produit && ps.quantite) {
      console.log("Format 1 détecté: produit imbriqué");
      return {
        id: ps.produit.id,
        nom: ps.produit.nom,
        reference: ps.produit.reference,
        quantite: ps.quantite
      };
    }
    
    // Format 2: produit avec quantité directement dans l'objet
    if (ps.id && ps.nom && ps.quantite !== undefined) {
      console.log("Format 2 détecté: produit avec quantité");
      return {
        id: ps.id,
        nom: ps.nom,
        reference: ps.reference || 'N/A',
        quantite: ps.quantite
      };
    }
    
    // Format 3: objet avec un id de produit et une quantité
    if (ps.produitId && ps.quantite) {
      console.log("Format 3 détecté: produitId et quantité");
      return {
        id: ps.produitId,
        nom: ps.nomProduit || 'Produit ' + ps.produitId,
        reference: ps.reference || 'N/A',
        quantite: ps.quantite
      };
    }
    
    // Format 4: objet produit_stock avec produit_id
    if (ps.produit_id && ps.quantite) {
      console.log("Format 4 détecté: produit_id et quantité");
      return {
        id: ps.produit_id,
        nom: ps.nom || 'Produit ' + ps.produit_id,
        reference: ps.reference || 'N/A',
        quantite: ps.quantite
      };
    }
    
    // Format 5: directement depuis la base MySQL (structure du tableau)
    if (ps && typeof ps.id === 'number' && typeof ps.quantite === 'number' && typeof ps.produit_id === 'number' && typeof ps.centre_stock_id === 'number') {
      console.log("Format 5 détecté: format MySQL brut");
      return {
        id: ps.produit_id,
        nom: 'Produit ' + ps.produit_id,
        reference: 'REF-' + ps.produit_id,
        quantite: ps.quantite
      };
    }
    
    // Format par défaut - essayer de récupérer ce qu'on peut
    console.log("Format par défaut utilisé");
    return {
      id: ps.id || ps.produitId || ps.produit_id || 'N/A',
      nom: ps.nom || ps.nomProduit || 'Produit sans nom',
      reference: ps.reference || 'N/A',
      quantite: ps.quantite || 0
    };
  };

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
                      <th>ID</th>
                      <th>Produit</th>
                      <th>Référence</th>
                      <th>Quantité</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produitsAvecNoms.map((ps) => (
                      <tr key={ps.id || `prod-${ps.id}`}>
                        <td>{ps.id}</td>
                        <td>{ps.nom}</td>
                        <td>{ps.reference}</td>
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
          <div className="card-footer py-2 d-flex">
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
          </div>
        </div>
      ) : (
        <div className="alert alert-warning">Stock non trouvé</div>
      )}
    </div>
  );
};

export default StockDetail;