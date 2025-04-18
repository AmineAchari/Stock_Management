import React, { useState, useEffect, useCallback } from "react"; // Ajout de useCallback
import { useNavigate, useParams } from "react-router-dom";
// Utilise apiService ou ProduitService, mais sois cohérent. Ici, j'utilise apiService comme dans fetchProduit.
import apiService from "../../services/api.service";
// ProduitService n'est plus nécessaire si apiService a toutes les méthodes
// import ProduitService from "../../services/produit.service";

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

const ProduitForm = () => {
  const initialProduitState = {
    nom: "",
    reference: "",
    description: ""
  };

  // L'état s'appelle 'produit', pas 'formData'
  const [produit, setProduit] = useState(initialProduitState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(""); // Ajout état d'erreur
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Utilisation de useCallback pour fetchProduit
  const fetchProduit = useCallback(async (produitId) => {
    setLoading(true); // Indiquer le chargement
    setMessage("");
    setError("");
    try {
      const response = await apiService.getProduitById(produitId);
      setProduit(response.data);
    } catch (err) { // Renommer error en err
      console.error("Erreur chargement produit:", err);
      setError("Erreur lors du chargement du produit.");
      setProduit(initialProduitState); // Revenir à l'état initial en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, [initialProduitState]); // Pas de dépendances externes directes

  useEffect(() => {
    if (id && id !== "new") {
      setIsEdit(true);
      fetchProduit(id);
    } else {
      setIsEdit(false);
      setProduit(initialProduitState);
    }
    // Ajout de fetchProduit comme dépendance
  }, [id, fetchProduit, initialProduitState]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProduit({ ...produit, [name]: value });
  };

  // Renommé saveProduit en handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError(""); // Réinitialiser l'erreur

    try {
      if (isEdit && id) { // Utiliser isEdit
        // Utiliser la variable 'produit' ici
        await apiService.updateProduit(id, produit);
        setMessage('Produit mis à jour avec succès!');
      } else {
        // Utiliser la variable 'produit' ici
        await apiService.createProduit(produit);
        setMessage('Produit créé avec succès!');
      }
      // Redirection après succès
      setTimeout(() => {
        navigate("/produits");
      }, 1500); // Délai pour voir le message
    } catch (err) { // Renommer error en err
      console.error("Erreur sauvegarde produit:", err);
      const resMessage = err.response?.data?.message || err.message || "Une erreur est survenue lors de la sauvegarde.";
      setError(resMessage); // Utiliser setError
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{isEdit ? "Modifier le produit" : "Ajouter un produit"}</h5>
           <ActionButton
              icon="fa-arrow-left"
              variant="outline-secondary" // Bouton retour plus discret
              onClick={() => navigate("/produits")}
              title="Retour à la liste"
              label="Retour"
            />
        </div>
        <div className="card-body">
          {/* Affichage des messages d'erreur et de succès */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="alert alert-success" role="alert"> {/* Utiliser alert-success */}
              {message}
            </div>
          )}

          {/* Afficher un spinner pendant le chargement initial en mode édition */}
          {loading && isEdit && (
             <div className="text-center my-3">
               <div className="spinner-border text-primary" role="status">
                 <span className="visually-hidden">Chargement...</span>
               </div>
             </div>
          )}

          {/* Ne pas afficher le formulaire pendant le chargement initial en mode édition */}
          {!(loading && isEdit) && (
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label htmlFor="nom">Nom <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="nom"
                  name="nom"
                  value={produit.nom}
                  onChange={handleInputChange}
                  required
                  disabled={loading} // Désactiver pendant la soumission
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="reference">Référence <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="reference"
                  name="reference"
                  value={produit.reference}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="description">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows="3"
                  value={produit.description}
                  onChange={handleInputChange}
                  disabled={loading}
                ></textarea>
              </div>

              <div className="d-flex gap-2 mt-4">
                <ActionButton
                  type="submit"
                  icon={isEdit ? "fa-save" : "fa-plus"}
                  variant="primary"
                  title={isEdit ? "Mettre à jour le produit" : "Ajouter le produit"}
                  label={isEdit ? "Mettre à jour" : "Ajouter"}
                  disabled={loading} // Désactivé pendant la soumission ou chargement initial
                />
                <ActionButton
                  icon="fa-times"
                  variant="secondary"
                  onClick={() => navigate("/produits")}
                  title="Annuler"
                  label="Annuler"
                  disabled={loading} // Désactiver aussi pendant la soumission
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProduitForm;
