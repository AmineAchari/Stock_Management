import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api.service";

// Add ActionButton component
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

  const [produit, setProduit] = useState(initialProduitState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id && id !== "new") {
      setIsEdit(true);
      fetchProduit(id);
    }
  }, [id]);

  const fetchProduit = async (id) => {
    try {
      const response = await apiService.getProduitById(id);
      setProduit(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors du chargement du produit");
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProduit({ ...produit, [name]: value });
  };

  const saveProduit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let response;
      if (isEdit) {
        response = await apiService.updateProduit(id, produit);
        setMessage("Le produit a été mis à jour avec succès!");
      } else {
        response = await apiService.createProduit(produit);
        setMessage("Le produit a été créé avec succès!");
      }
      setTimeout(() => {
        navigate("/produits");
      }, 1500);
    } catch (error) {
      console.error("Erreur:", error);
      const resMessage = error.response?.data?.message || error.message || "Une erreur est survenue";
      setMessage(resMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">{isEdit ? "Modifier le produit" : "Ajouter un produit"}</h5>
        </div>
        <div className="card-body">
          {message && (
            <div className="alert alert-info" role="alert">
              {message}
            </div>
          )}

          <form onSubmit={saveProduit}>
            <div className="form-group mb-3">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                className="form-control"
                id="nom"
                name="nom"
                value={produit.nom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="reference">Référence</label>
              <input
                type="text"
                className="form-control"
                id="reference"
                name="reference"
                value={produit.reference}
                onChange={handleInputChange}
                required
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
              ></textarea>
            </div>

            <div className="d-flex gap-2">
              <ActionButton
                type="submit"
                icon="fa-save"
                variant="primary"
                title="Enregistrer le produit"
                label="Enregistrer"
                disabled={loading}
              />
              <ActionButton
                icon="fa-times"
                variant="secondary"
                onClick={() => navigate("/produits")}
                title="Annuler les modifications"
                label="Annuler"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProduitForm;