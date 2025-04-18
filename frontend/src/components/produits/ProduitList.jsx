import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProduitService from '../../services/produit.service';
import ImportProduitsModal from './ImportProduitsModal';

// Composant ActionButton (peut être externalisé si utilisé ailleurs)
const ActionButton = ({ icon, label, variant, onClick, title }) => (
  <button
    className={`btn btn-${variant} btn-sm mx-1`}
    onClick={onClick}
    title={title}
  >
    <i className={`fas ${icon} me-1`}></i> {label}
  </button>
);

const ProduitList = () => {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]); // Données originales
  const [filteredProduits, setFilteredProduits] = useState([]); // Données filtrées pour l'affichage
  const [searchTerm, setSearchTerm] = useState(''); // Terme de recherche
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Charger les produits au montage initial
  useEffect(() => {
    loadProduits();
  }, []);

  // Effet pour filtrer les produits quand la liste ou le terme de recherche change
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearchTerm) {
      setFilteredProduits(produits); // Si recherche vide, afficher tout
    } else {
      const filtered = produits.filter(produit => {
        // Vérification sûre pour nom et référence
        const nomMatch = String(produit.nom || '').toLowerCase().includes(lowerCaseSearchTerm);
        const referenceMatch = String(produit.reference || '').toLowerCase().includes(lowerCaseSearchTerm);
        return nomMatch || referenceMatch;
      });
      setFilteredProduits(filtered);
    }
  }, [produits, searchTerm]); // Dépendances : produits et searchTerm

  // Fonction pour charger les produits (async/await)
  const loadProduits = async () => {
    setLoading(true);
    setError(''); // Réinitialiser l'erreur à chaque chargement
    // Ne pas réinitialiser le succès ici pour le garder visible après une action réussie
    try {
      const response = await ProduitService.getAllProduits();
      setProduits(response.data);
      // Le filtrage sera appliqué par l'useEffect ci-dessus
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setError('Erreur lors du chargement des produits. Veuillez réessayer.');
      setProduits([]); // Vider la liste en cas d'erreur
      setFilteredProduits([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un produit (async/await)
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setLoading(true); // Indiquer une action en cours
      setError('');
      setSuccess('');
      try {
        await ProduitService.deleteProduit(id);
        setSuccess('Produit supprimé avec succès');
        // Pas besoin de recharger explicitement si le backend renvoie la liste à jour
        // ou si on filtre manuellement la liste actuelle.
        // Pour la simplicité, on recharge :
        await loadProduits(); // Recharger la liste mettra à jour 'produits' et déclenchera le filtre
      } catch (error) {
        console.error('Erreur suppression produit:', error);
        setError(`Erreur lors de la suppression: ${error.response?.data?.message || error.message || 'Erreur inconnue'}`);
        setLoading(false); // Important d'arrêter le loading en cas d'échec ici
      }
      // Pas de finally setLoading(false) ici car loadProduits le gère en cas de succès
    }
  };

  const handleImportSuccess = () => {
    loadProduits(); // Recharger après import
    setShowImportModal(false);
    setSuccess("Produits importés avec succès !"); // Message de succès pour l'import
    setTimeout(() => setSuccess(''), 4000); // Faire disparaître le message après 4s
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Liste des Produits</h5>
          <div>
            <ActionButton
              icon="fa-plus"
              variant="primary"
              onClick={() => navigate('/produits/new')}
              title="Ajouter un nouveau produit"
              label="Ajouter"
            />
            <ActionButton
              icon="fa-file-import"
              variant="success"
              onClick={() => setShowImportModal(true)}
              title="Importer des produits depuis Excel"
              label="Importer"
            />
          </div>
        </div>
        <div className="card-body">
          {/* Afficher les messages d'erreur ou de succès */}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {success && <div className="alert alert-success" role="alert">{success}</div>}

          {/* Champ de recherche */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher par nom ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading} // Désactiver pendant le chargement
            />
          </div>

          {loading ? (
            <div className="text-center my-5"> {/* Plus d'espace vertical */}
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-2">Chargement des produits...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-hover"> {/* Ajout table-hover */}
                <thead className="table-dark"> {/* En-tête sombre */}
                  <tr>
                    <th>Ref</th>
                    <th>Nom</th>
                    <th>Description</th>
                    <th className="text-center">Actions</th> {/* Centrer actions */}
                  </tr>
                </thead>
                <tbody>
                  {filteredProduits.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4"> {/* Plus d'espace vertical */}
                        {searchTerm
                          ? `Aucun produit trouvé pour "${searchTerm}"`
                          : 'Aucun produit n\'a été ajouté pour le moment.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProduits.map(produit => (
                      <tr key={produit.id}>
                        <td>{produit.reference}</td>
                        <td>{produit.nom}</td>
                        {/* Tronquer la description si elle est trop longue */}
                        <td title={produit.description}>
                          {produit.description && produit.description.length > 50
                            ? `${produit.description.substring(0, 50)}...`
                            : produit.description || '-'} {/* Afficher '-' si vide */}
                        </td>
                        <td className="text-center"> {/* Centrer actions */}
                          <div className="btn-group btn-group-sm"> {/* Utiliser btn-group pour alignement */}
                            <ActionButton
                              icon="fa-eye"
                              variant="outline-info" // Outline pour moins d'encombrement
                              onClick={() => navigate(`/produits/${produit.id}`)}
                              title="Voir les détails du produit"
                              label="" // Label vide pour ne montrer que l'icône
                            />
                            <ActionButton
                              icon="fa-edit"
                              variant="outline-warning" // Outline
                              onClick={() => navigate(`/produits/edit/${produit.id}`)}
                              title="Modifier le produit"
                              label="" // Label vide
                            />
                            <ActionButton
                              icon="fa-trash"
                              variant="outline-danger" // Outline
                              onClick={() => handleDelete(produit.id)}
                              title="Supprimer le produit"
                              label="" // Label vide
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'importation */}
      <ImportProduitsModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess} // Utiliser la nouvelle fonction
      />
    </div>
  );
};

export default ProduitList;
