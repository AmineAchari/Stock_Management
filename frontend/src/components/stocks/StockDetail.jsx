// c:\Users\Dell_Amine\Desktop\Stock_Management\frontend\src\components\stocks\StockDetail.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import apiService from "../../services/api.service";
import stockService from "../../services/stock.service"; // Gardé pour l'export Excel du stock

const StockDetail = () => {
  const [stock, setStock] = useState(null);
  // produitsAvecNoms ne contient pas la note
  const [produitsAvecNoms, setProduitsAvecNoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [produitsLoading, setProduitsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState('');
  const { id } = useParams(); // ID du Stock

  // États pour l'édition de quantité
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null); // ID du produit en cours d'édition
  const [nouvelleQuantite, setNouvelleQuantite] = useState(0);
  // Pas d'état pour nouvelleNote

  // État pour le filtre des produits
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // --- FONCTIONS DE FETCH ---

  // Charger les détails du stock
  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const response = await apiService.getStockById(id);
      setStock(response.data);
    } catch (err) {
      console.error("Erreur chargement stock:", err);
      setError(err.response?.data?.message || "Erreur lors du chargement du stock");
      setStock(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Charger les produits associés à ce stock (ProduitStock)
  const fetchProduitsByStock = useCallback(async () => {
    try {
      setProduitsLoading(true);
      setError('');
      setMessage('');
      console.log("Récupération des produits pour le stock ID:", id);
      const response = await apiService.getProduitsByStock(id);

      // La réponse contient des objets ProduitStock
      const rawProduitsStock = response.data || [];
      console.log("Données brutes ProduitStock reçues:", rawProduitsStock);

      // Traitement pour extraire les infos nécessaires (SANS la note)
      const produitsProcessed = rawProduitsStock.map(item => {
        const produitData = item.produit;
        if (!produitData) {
            console.warn("Produit manquant dans l'item ProduitStock:", item);
            return null;
        }
        return {
          id: produitData.id,
          produitStockId: item.id,
          nom: produitData.nom || 'Nom Inconnu',
          reference: produitData.reference || 'Ref Inconnue',
          quantite: item.quantite !== undefined ? item.quantite : 0,
          // Pas de note ici
          seuilAlerte: produitData.seuilAlerte
        };
      }).filter(p => p !== null);

      console.log("Produits traités:", produitsProcessed);
      setProduitsAvecNoms(produitsProcessed);

    } catch (err) {
      console.error("Erreur lors du chargement des produits:", err);
      setError(err.response?.data?.message || "Erreur lors du chargement des produits du stock");
      setProduitsAvecNoms([]);
    } finally {
      setProduitsLoading(false);
    }
  }, [id]);

  // Effet principal pour charger les données au montage
  useEffect(() => {
    fetchStock();
    fetchProduitsByStock();
  }, [fetchStock, fetchProduitsByStock]);

  // Calculer les produits filtrés (sans recherche sur la note)
  const filteredProduits = useMemo(() => {
    const lowerCaseSearch = productSearchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) {
      return produitsAvecNoms;
    }
    return produitsAvecNoms.filter(p => {
      const nomMatch = String(p.nom || '').toLowerCase().includes(lowerCaseSearch);
      const referenceMatch = String(p.reference || '').toLowerCase().includes(lowerCaseSearch);
      // Pas de noteMatch ici
      return nomMatch || referenceMatch;
    });
  }, [produitsAvecNoms, productSearchTerm]);

  // --- HANDLERS ---

  const handleRefreshProduits = () => {
    setMessage("Rafraîchissement des produits...");
    setError('');
    fetchProduitsByStock();
    setTimeout(() => setMessage(""), 2000);
  };

  // Initialise l'édition (SANS la note)
  const handleEdit = (produit) => {
    setEditMode(true);
    setEditingId(produit.id);
    setNouvelleQuantite(produit.quantite);
    setError('');
    setMessage('');
  };

  // Sauvegarde SEULEMENT la quantité
  const handleSave = async (produitId) => {
    try {
      setMessage("Modification en cours...");
      setError('');
      // Appelle le service pour modifier SEULEMENT la quantité
      await apiService.modifierQuantite(produitId, id, nouvelleQuantite);
      setEditMode(false);
      setEditingId(null);
      setMessage("Quantité modifiée avec succès!");
      fetchProduitsByStock();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Erreur lors de la modification de la quantité:", err);
      setError(err.response?.data?.message || "Erreur lors de la modification");
      setMessage('');
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditingId(null);
  };

  // Export Excel (inchangé)
  const handleExport = async () => {
     try {
      setMessage("Exportation en cours...");
      setError('');
      const response = await stockService.exportStockDetails(id);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      const filename = `stock_${stock?.nom || 'details'}_${today}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage("Export réussi!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Erreur lors de l'exportation:", err);
      setError(err.response?.data?.message || "Erreur lors de l'exportation du fichier");
      setMessage('');
    }
  };

  // Annuler l'affectation (inchangé)
  const handleAnnulerAffectation = async (produitId) => {
     if (window.confirm("Êtes-vous sûr de vouloir retirer ce produit du stock ?")) {
      try {
        setMessage("Retrait en cours...");
        setError('');
        await apiService.annulerAffectation(produitId, id);
        setMessage("Produit retiré du stock avec succès !");
        fetchProduitsByStock();
        setTimeout(() => setMessage(""), 3000);
      } catch (err) {
        console.error("Erreur lors du retrait:", err);
        setError(err.response?.data?.message || "Erreur lors du retrait du produit du stock.");
        setMessage('');
      }
    }
  };

  // --- Rendu JSX ---

  return (
    <div className="container mt-4">
      {/* Affichage chargement initial du stock */}
      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement du stock...</span>
          </div>
        </div>
      ) : stock ? (
        // Affichage principal si le stock est chargé
        <div className="card shadow-sm">
          {/* En-tête de la carte */}
          <div className="card-header d-flex justify-content-between align-items-center py-3">
            <h4 className="mb-0">Détails du Stock : {stock.nom}</h4>
            <Link to="/stocks" className="btn btn-outline-secondary btn-sm">
              <i className="fas fa-arrow-left me-1"></i> Retour à la liste
            </Link>
          </div>
          {/* Corps de la carte */}
          <div className="card-body">
            {/* Messages d'erreur/succès */}
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
            {message && !error && <div className="alert alert-info py-2" role="alert">{message}</div>}

            {/* Informations du stock */}
            <div className="row mb-4">
              <div className="col-md-6">
                <p className="mb-2"><strong>ID:</strong> {stock.id}</p>
                <p className="mb-2"><strong>Adresse:</strong> {stock.adresse || 'Non spécifiée'}</p>
                <p className="mb-2"><strong>Ville:</strong> {stock.ville}</p>
              </div>
              <div className="col-md-6">
                <p className="mb-2"><strong>Pays:</strong> {stock.pays}</p>
                <p className="mb-2"><strong>Type:</strong> {stock.typeStock}</p>
              </div>
            </div>

            {/* Barre d'actions principale */}
            <div className="d-flex justify-content-between align-items-center mb-4 border-top pt-3">
              <div>
                <Link to={`/stocks/edit/${stock.id}`} className="btn btn-warning me-2">
                  <i className="fas fa-edit me-1"></i> Modifier le Stock
                </Link>
                <Link to="/affectation" className="btn btn-primary">
                  <i className="fas fa-plus me-1"></i> Affecter un Produit
                </Link>
              </div>
              <button
                className="btn btn-success"
                onClick={handleExport}
                disabled={produitsLoading || filteredProduits.length === 0}
                title={filteredProduits.length === 0 ? "Aucun produit à exporter" : "Exporter la liste des produits en Excel"}
              >
                <i className="fas fa-file-excel me-1"></i> Exporter
              </button>
            </div>

            {/* Section Produits */}
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Produits dans ce stock</h5>
                <button
                  onClick={handleRefreshProduits}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={produitsLoading}
                  title="Rafraîchir la liste des produits"
                >
                  {produitsLoading ? (
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  ) : (
                    <i className="fas fa-sync-alt me-1"></i>
                  )}
                  Rafraîchir
                </button>
              </div>

              {/* Champ de recherche pour les produits */}
              {!produitsLoading && produitsAvecNoms.length > 0 && (
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher par nom ou référence..." // Placeholder original
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                </div>
              )}

              {/* Table des produits */}
              {produitsLoading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-secondary" role="status">
                    <span className="visually-hidden">Chargement des produits...</span>
                  </div>
                  <p className="mt-2">Chargement des produits...</p>
                </div>
              ) : produitsAvecNoms.length === 0 ? (
                <div className="alert alert-info d-flex align-items-center justify-content-between">
                  <span><i className="fas fa-info-circle me-2"></i>Aucun produit n'est actuellement affecté à ce stock.</span>
                  <Link to="/affectation" className="btn btn-primary btn-sm">
                    <i className="fas fa-plus me-1"></i>Affecter un produit
                  </Link>
                </div>
              ) : filteredProduits.length === 0 ? (
                <div className="alert alert-warning text-center">
                  <i className="fas fa-search me-2"></i>Aucun produit ne correspond à votre recherche "{productSearchTerm}".
                </div>
              ) : (
                <div className="table-responsive">
                  {/* --- TABLE SANS NOTE --- */}
                  <table className="table table-striped table-hover table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th>Référence</th>
                        <th>Produit</th>
                        <th>Quantité</th>
                        {/* Pas de colonne Note */}
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProduits.map((ps) => (
                        <tr key={ps.id}> {/* Utilise l'ID du produit comme clé */}
                          <td>{ps.reference}</td>
                          <td>{ps.nom}</td>
                          {/* Cellule Quantité */}
                          <td>
                            {editMode && editingId === ps.id ? (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                min="0"
                                value={nouvelleQuantite}
                                onChange={(e) => setNouvelleQuantite(parseInt(e.target.value) || 0)}
                                style={{ width: '80px' }}
                              />
                            ) : (
                              <span className={`badge fs-6 ${ps.quantite > (ps.seuilAlerte || 10) ? 'bg-success' : ps.quantite > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                {ps.quantite}
                              </span>
                            )}
                          </td>
                          {/* Pas de cellule Note */}
                          {/* Cellule Actions */}
                          <td className="text-center">
                            {editMode && editingId === ps.id ? (
                              // Boutons Sauver/Annuler
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-success" onClick={() => handleSave(ps.id)} title="Sauvegarder Quantité">
                                  <i className="fa-solid fa-floppy-disk"></i>
                                </button>
                                <button className="btn btn-outline-secondary" onClick={handleCancel} title="Annuler">
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </div>
                            ) : (
                              // Boutons Voir/Modifier/Supprimer
                              <div className="btn-group btn-group-sm">
                                <Link to={`/produits/${ps.id}`} className="btn btn-outline-info" title="Voir détails produit">
                                  <i className="fa-solid fa-circle-info"></i>
                                </Link>
                                <button className="btn btn-outline-warning" onClick={() => handleEdit(ps)} title="Modifier quantité"> {/* Titre mis à jour */}
                                  <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button className="btn btn-outline-danger" onClick={() => handleAnnulerAffectation(ps.id)} title="Retirer du stock">
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Footer de la table */}
                    <tfoot className="table-light fw-bold">
                      <tr>
                        <td colSpan="2" className="text-end">Total réel en stock :</td>
                        <td>
                          {produitsAvecNoms.reduce((total, ps) => total + (ps.quantite || 0), 0)}
                        </td>
                        {/* Colonne vide pour les actions */}
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                  {/* --- FIN TABLE SANS NOTE --- */}
                </div>
              )}
            </div> {/* Fin Section Produits */}
          </div> {/* Fin card-body */}
        </div>
      ) : (
         // Affichage erreur ou stock non trouvé
         error ? (
            <div className="alert alert-danger mt-4">{error}</div>
         ) : (
            !loading && <div className="alert alert-warning mt-4">Stock non trouvé.</div>
         )
      )}
    </div>
  );
};

export default StockDetail;
