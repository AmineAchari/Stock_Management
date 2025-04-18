import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Ajout de useNavigate
import apiService from "../../services/api.service";
// Importe le service produit si tu as besoin de la fonction delete
import ProduitService from "../../services/produit.service";

// Composant ActionButton (peut être externalisé)
const ActionButton = ({ icon, label, variant, onClick, title, type, disabled }) => (
  <button
    type={type || "button"}
    className={`btn btn-${variant} btn-sm mx-1`}
    onClick={onClick}
    title={title}
    disabled={disabled}
  >
    {disabled ? (
      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
    ) : (
      <i className={`fas ${icon} me-1`}></i>
    )}
    {label}
  </button>
);


const ProduitDetail = () => {
  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Pour les messages de succès/info (ex: suppression)
  const { id } = useParams();
  const navigate = useNavigate(); // Pour la redirection après suppression

  // Fonction pour charger les détails du produit
  const fetchProduit = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError('');
    setMessage(''); // Reset message on fetch
    try {
      const response = await apiService.getProduitById(id);
      setProduit(response.data);
    } catch (err) {
      console.error("Erreur chargement produit:", err);
      setError(err.response?.data?.message || "Erreur lors du chargement du produit.");
      setProduit(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Charger les données au montage
  useEffect(() => {
    fetchProduit();
  }, [fetchProduit]);

  // Fonction pour gérer la suppression
  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le produit "${produit?.nom}" ?`)) {
      setLoading(true); // Indiquer une action en cours
      setError('');
      setMessage('');
      try {
        await ProduitService.deleteProduit(id); // Utilise le service approprié
        setMessage('Produit supprimé avec succès ! Redirection...');
        // Rediriger vers la liste après un court délai
        setTimeout(() => {
          navigate("/produits");
        }, 2000);
      } catch (err) {
        console.error('Erreur suppression produit:', err);
        setError(`Erreur lors de la suppression: ${err.response?.data?.message || err.message || 'Erreur inconnue'}`);
        setLoading(false); // Arrêter le chargement en cas d'erreur
      }
      // Pas de finally setLoading(false) ici car la redirection a lieu en cas de succès
    }
  };


  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          {/* Titre dynamique */}
          <h5 className="mb-0">
            {loading ? "Chargement..." : (produit ? `Détails du produit : ${produit.nom}` : "Détails du produit")}
          </h5>
          <ActionButton
              icon="fa-arrow-left"
              variant="outline-secondary"
              onClick={() => navigate("/produits")}
              title="Retour à la liste"
              label="Retour"
            />
        </div>
        <div className="card-body">
          {/* Affichage des messages */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="alert alert-success" role="alert"> {/* Utiliser success pour le message de suppression */}
              {message}
            </div>
          )}

          {/* État de chargement */}
          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-2">Chargement des détails...</p>
            </div>
          ) : produit ? (
            // Affichage des détails si le produit est chargé
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <p className="mb-1"><strong>ID:</strong></p>
                  <p className="text-muted">{produit.id}</p>
                </div>
                <div className="col-md-6">
                  <p className="mb-1"><strong>Référence:</strong></p>
                  <p className="text-muted">{produit.reference}</p>
                </div>
              </div>
              <div className="mb-3">
                <p className="mb-1"><strong>Nom:</strong></p>
                <p className="text-muted">{produit.nom}</p>
              </div>
              <div className="mb-3">
                <p className="mb-1"><strong>Description:</strong></p>
                <p className="text-muted">{produit.description || <span className="fst-italic">Non spécifiée</span>}</p>
              </div>

              {/* Ajouter ici d'autres informations pertinentes si nécessaire */}
              {/* Par exemple, les stocks où ce produit est présent */}

            </div>
          ) : (
            // Affichage si le produit n'est pas trouvé (et pas en chargement/erreur)
            !error && <div className="alert alert-warning">Produit non trouvé.</div>
          )}
        </div>
        {/* Pied de la carte avec les actions (seulement si produit chargé et pas en cours de suppression) */}
        {produit && !message.includes('Redirection') && (
          <div className="card-footer d-flex justify-content-end gap-2">
             <ActionButton
                icon="fa-edit"
                variant="warning" // Bouton Modifier
                onClick={() => navigate(`/produits/edit/${produit.id}`)}
                title="Modifier ce produit"
                label="Modifier"
                disabled={loading}
              />
             <ActionButton
                icon="fa-trash"
                variant="danger" // Bouton Supprimer
                onClick={handleDelete}
                title="Supprimer ce produit"
                label="Supprimer"
                disabled={loading} // Désactivé pendant le chargement/suppression
              />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProduitDetail;
