import React, { useState, useEffect, useCallback } from "react"; // Ajout de useCallback
import { useNavigate, useParams } from "react-router-dom";
// Utilise apiService ou StockService, mais sois cohérent. Ici, j'utilise apiService comme dans fetchStock.
import apiService from "../../services/api.service";
// StockService n'est plus nécessaire si apiService a toutes les méthodes
// import StockService from "../../services/stock.service";


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

const StockForm = () => {
  const initialStockState = {
    nom: "",
    adresse: "",
    ville: "",
    pays: "",
    typeStock: "ENTREPOT" // Valeur par défaut
  };

  // L'état s'appelle 'stock', pas 'formData'
  const [stock, setStock] = useState(initialStockState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(""); // Ajout état d'erreur
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Utilisation de useCallback pour fetchStock
  const fetchStock = useCallback(async (stockId) => {
    setLoading(true); // Indiquer le chargement
    setMessage("");
    setError("");
    try {
      const response = await apiService.getStockById(stockId);
      setStock(response.data);
    } catch (err) { // Renommer error en err
      console.error("Erreur chargement stock:", err);
      setError("Erreur lors du chargement du stock.");
      setStock(initialStockState); // Revenir à l'état initial en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, []); // Pas de dépendances externes directes, mais id est utilisé dans useEffect

  useEffect(() => {
    if (id && id !== "new") {
      setIsEdit(true);
      fetchStock(id);
    } else {
      // S'assurer que le formulaire est vide si ce n'est pas une édition
      setIsEdit(false);
      setStock(initialStockState);
    }
    // Ajout de fetchStock comme dépendance
  }, [id, fetchStock]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setStock({ ...stock, [name]: value });
  };

  // Renommé saveStock en handleSubmit pour la cohérence
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError(""); // Réinitialiser l'erreur

    try {
      if (isEdit && id) { // Utiliser isEdit pour plus de clarté
        // Utiliser la variable 'stock' ici
        await apiService.updateStock(id, stock);
        setMessage('Stock mis à jour avec succès!');
      } else {
        // Utiliser la variable 'stock' ici
        await apiService.createStock(stock);
        setMessage('Stock créé avec succès!');
      }
      // Redirection après succès
      setTimeout(() => {
        navigate("/stocks");
      }, 1500); // Délai pour voir le message
    } catch (err) { // Renommer error en err
      console.error("Erreur sauvegarde stock:", err);
      const resMessage = err.response?.data?.message || err.message || "Une erreur est survenue lors de la sauvegarde.";
      setError(resMessage); // Utiliser setError
    } finally {
      setLoading(false);
    }
  };

  // L'autre useEffect avec 'stock-updated' semble redondant si la navigation
  // après sauvegarde fonctionne correctement. Si tu en as besoin pour une
  // mise à jour en temps réel sans rechargement, il faudrait clarifier son but.
  // Je le commente pour l'instant.
  // useEffect(() => {
  //   const handleStockUpdate = () => {
  //     if (id) fetchStock(id); // Recharger seulement si on est en mode édition
  //   };
  //   window.addEventListener('stock-updated', handleStockUpdate);
  //   return () => {
  //     window.removeEventListener('stock-updated', handleStockUpdate);
  //   };
  // }, [id, fetchStock]); // Ajouter fetchStock aux dépendances

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{isEdit ? "Modifier le stock" : "Ajouter un stock"}</h5>
          <ActionButton
              icon="fa-arrow-left"
              variant="outline-secondary" // Bouton retour plus discret
              onClick={() => navigate("/stocks")}
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
            <div className="alert alert-success" role="alert"> {/* Utiliser alert-success pour succès */}
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
              <div className="form-group mb-3"> {/* Ajout mb-3 pour espacement */}
                <label htmlFor="nom">Nom <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="nom"
                  name="nom"
                  value={stock.nom}
                  onChange={handleInputChange}
                  required
                  disabled={loading} // Désactiver pendant la soumission
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="adresse">Adresse</label> {/* Adresse peut être optionnelle ? */}
                <input
                  type="text"
                  className="form-control"
                  id="adresse"
                  name="adresse"
                  value={stock.adresse}
                  onChange={handleInputChange}
                  // required // Enlever si optionnel
                  disabled={loading}
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="ville">Ville <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="ville"
                  name="ville"
                  value={stock.ville}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="pays">Pays <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="pays"
                  name="pays"
                  value={stock.pays}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="typeStock">Type de stock <span className="text-danger">*</span></label>
                <select
                  className="form-select" // Utiliser form-select pour Bootstrap 5
                  id="typeStock"
                  name="typeStock"
                  value={stock.typeStock}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="ENTREPOT">ENTREPOT</option>
                  <option value="REPRESENTANT">REPRESENTANT</option>
                  <option value="PRESTATAIRE">PRESTATAIRE</option>
                </select>
              </div>

              <div className="d-flex gap-2 mt-4"> {/* Augmenter l'espace avant les boutons */}
                <ActionButton
                  type="submit"
                  icon={isEdit ? "fa-save" : "fa-plus"} // Icône différente pour ajout/modif
                  variant="primary"
                  title={isEdit ? "Mettre à jour le stock" : "Ajouter le stock"}
                  label={isEdit ? "Mettre à jour" : "Ajouter"}
                  disabled={loading} // Désactivé pendant la soumission ou chargement initial
                />
                <ActionButton
                  icon="fa-times"
                  variant="secondary"
                  onClick={() => navigate("/stocks")}
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

export default StockForm;
