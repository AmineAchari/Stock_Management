import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Ajout de useMemo
// Importe le composant Select de react-select
import Select from 'react-select';
import ProduitService from '../../services/produit.service';
import StockService from '../../services/stock.service';
import apiService from '../../services/api.service'; // apiService est utilisé pour affecterProduit

const AffectationProduit = () => {
  const [produits, setProduits] = useState([]);
  const [stocks, setStocks] = useState([]);
  // Les états pour react-select stockent l'objet option complet { value, label } ou null
  const [selectedProduitOption, setSelectedProduitOption] = useState(null);
  const [selectedStockOption, setSelectedStockOption] = useState(null);
  const [quantite, setQuantite] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    // ... (fonction loadData inchangée) ...
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [produitsResponse, stocksResponse] = await Promise.all([
        ProduitService.getAllProduits(),
        StockService.getAllStocks()
      ]);
      setProduits(produitsResponse.data);
      setStocks(stocksResponse.data);
    } catch (err) {
      console.error("Erreur chargement données:", err);
      setError('Erreur lors du chargement des produits ou des stocks.');
      setProduits([]);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formater les données pour react-select en utilisant useMemo pour l'optimisation
  const produitOptions = useMemo(() =>
    produits.map(p => ({
      value: p.id, // La valeur sera l'ID
      label: `${p.reference} - ${p.nom}` // Le label affiché
    })), [produits]);

  const stockOptions = useMemo(() =>
    stocks.map(s => ({
      value: s.id,
      label: `${s.nom} (${s.ville})`
    })), [stocks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation utilisant les options sélectionnées
    if (!selectedProduitOption || !selectedStockOption || quantite === '' || parseInt(quantite) < 0) {
      setError('Veuillez sélectionner un produit, un stock et entrer une quantité valide (positive ou nulle).');
      return;
    }

    setSubmitting(true);

    try {
      // Utilise .value pour obtenir l'ID de l'option sélectionnée
      await apiService.affecterProduit(
        selectedProduitOption.value,
        selectedStockOption.value,
        parseInt(quantite)
      );

      setSuccess('Affectation réussie !');

      // Réinitialiser les options sélectionnées et la quantité
      setSelectedProduitOption(null);
      setSelectedStockOption(null);
      setQuantite('');

      setTimeout(() => setSuccess(''), 3000);
      // Optionnel: Redirection
      // setTimeout(() => navigate(`/stocks/${selectedStockOption.value}`), 1500);

    } catch (err) {
      console.error('Erreur lors de l\'affectation:', err);
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors de l\'affectation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectionChange = () => {
    if (error) {
      setError('');
    }
  };

  // Styles personnalisés pour react-select (optionnel, pour ressembler à Bootstrap)
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#86b7fe' : '#ced4da', // Correspondance Bootstrap focus/default
      boxShadow: state.isFocused ? '0 0 0 0.25rem rgb(13 110 253 / 25%)' : 'none', // Correspondance Bootstrap focus
      '&:hover': {
        borderColor: '#adb5bd' // Correspondance Bootstrap hover
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 2 // Pour s'assurer que le menu déroulant est au-dessus des autres éléments
    })
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">Affecter un Produit à un Stock</h5>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement des données...</span>
              </div>
              <p className="mt-2">Chargement...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Sélection du Produit avec react-select */}
              <div className="mb-3">
                <label htmlFor="produit-select" className="form-label">Produit <span className="text-danger">*</span></label>
                <Select
                  inputId="produit-select" // Lie le label au composant
                  options={produitOptions} // Les options formatées
                  value={selectedProduitOption} // L'option sélectionnée (objet ou null)
                  onChange={(selectedOption) => {
                    setSelectedProduitOption(selectedOption); // Met à jour avec l'objet option
                    handleSelectionChange();
                  }}
                  placeholder="Rechercher ou sélectionner un produit..."
                  isClearable // Permet de vider la sélection
                  isDisabled={submitting}
                  styles={customSelectStyles} // Applique les styles personnalisés
                  noOptionsMessage={() => "Aucun produit trouvé"}
                />
                {/* Input caché pour la validation HTML5 'required' si nécessaire, mais la validation JS est préférable */}
                {/* <input type="text" value={selectedProduitOption ? selectedProduitOption.value : ''} required style={{ display: 'none' }} readOnly /> */}
              </div>

              {/* Sélection du Stock avec react-select */}
              <div className="mb-3">
                <label htmlFor="stock-select" className="form-label">Stock <span className="text-danger">*</span></label>
                <Select
                  inputId="stock-select"
                  options={stockOptions}
                  value={selectedStockOption}
                  onChange={(selectedOption) => {
                    setSelectedStockOption(selectedOption);
                    handleSelectionChange();
                  }}
                  placeholder="Rechercher ou sélectionner un stock..."
                  isClearable
                  isDisabled={submitting}
                  styles={customSelectStyles}
                  noOptionsMessage={() => "Aucun stock trouvé"}
                />
                 {/* <input type="text" value={selectedStockOption ? selectedStockOption.value : ''} required style={{ display: 'none' }} readOnly /> */}
              </div>

              {/* Champ Quantité (inchangé) */}
              <div className="mb-3">
                <label htmlFor="quantite" className="form-label">Quantité Initiale <span className="text-danger">*</span></label>
                <input
                  type="number"
                  className="form-control"
                  id="quantite"
                  value={quantite}
                  onChange={(e) => {
                      setQuantite(e.target.value);
                      handleSelectionChange();
                  }}
                  min="0"
                  required // Garder pour la validation HTML5 de base
                  disabled={submitting}
                  placeholder="Entrez la quantité initiale"
                />
              </div>

              {/* Bouton de soumission (inchangé) */}
              <button type="submit" className="btn btn-primary" disabled={submitting || loading}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Affectation...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2"></i> Affecter
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffectationProduit;
