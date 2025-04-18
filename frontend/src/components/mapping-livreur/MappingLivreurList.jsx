import React, { useState, useEffect } from 'react';
import MappingLivreurService from '../../services/mapping-livreur.service';

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

const MappingLivreurList = () => {
  const [mappings, setMappings] = useState([]); // Données originales
  const [filteredMappings, setFilteredMappings] = useState([]); // Données filtrées
  const [searchTerm, setSearchTerm] = useState(''); // Terme de recherche
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // États pour les Modals (inchangés)
  const [showModal, setShowModal] = useState(false);
  const [currentMapping, setCurrentMapping] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importMessage, setImportMessage] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // État pour le formulaire (inchangé)
  const [formData, setFormData] = useState({
    nomLivreur: '',
    prestataire: '',
    ville: '',
    typeStock: 'REPRESENTANT'
  });

  // Charger les mappings au montage
  useEffect(() => {
    loadMappings();
  }, []);

  // Effet pour filtrer les mappings
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearchTerm) {
      setFilteredMappings(mappings); // Si recherche vide, afficher tout
    } else {
      const filtered = mappings.filter(mapping => {
        const nomMatch = String(mapping.nomLivreur || '').toLowerCase().includes(lowerCaseSearchTerm);
        const prestataireMatch = String(mapping.prestataire || '').toLowerCase().includes(lowerCaseSearchTerm);
        const villeMatch = String(mapping.ville || '').toLowerCase().includes(lowerCaseSearchTerm);
        return nomMatch || prestataireMatch || villeMatch;
      });
      setFilteredMappings(filtered);
    }
  }, [mappings, searchTerm]); // Dépendances : mappings et searchTerm

  // Fonction pour charger les mappings (async/await)
  const loadMappings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await MappingLivreurService.getAllMappings();
      setMappings(response.data);
      // Le filtrage sera appliqué par l'useEffect
    } catch (error) {
      setError('Erreur lors du chargement des mappings: ' + (error.response?.data?.message || error.message));
      setMappings([]); // Vider en cas d'erreur
      setFilteredMappings([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers pour les Modals (inchangés pour l'ouverture/fermeture) ---
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentMapping(null);
    setFormData({ nomLivreur: '', prestataire: '', ville: '', typeStock: 'REPRESENTANT' });
    setError(''); // Effacer les erreurs spécifiques au modal
  };

  const handleShowAddModal = () => {
    setCurrentMapping(null);
    setModalTitle('Ajouter un mapping de livreur');
    setFormData({ nomLivreur: '', prestataire: '', ville: '', typeStock: 'REPRESENTANT' });
    setShowModal(true);
  };

  const handleShowEditModal = (mapping) => {
    setCurrentMapping(mapping);
    setModalTitle('Modifier le mapping de livreur');
    setFormData({
      nomLivreur: mapping.nomLivreur,
      prestataire: mapping.prestataire,
      ville: mapping.ville,
      typeStock: mapping.typeStock
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Handlers pour les actions CRUD (async/await) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    const serviceCall = currentMapping
      ? MappingLivreurService.updateMapping(currentMapping.id, formData)
      : MappingLivreurService.createMapping(formData);

    try {
      await serviceCall;
      await loadMappings(); // Reload data on success
      handleCloseModal();
    } catch (error) {
      const action = currentMapping ? 'la mise à jour' : 'la création';
      // Afficher l'erreur dans le modal ou globalement ? Ici globalement.
      setError(`Erreur lors de ${action}: ` + (error.response?.data?.message || error.message));
      // Optionnel: afficher l'erreur aussi dans le modal si on ajoute un état d'erreur au modal
    }
  };

  const confirmDelete = (mapping) => {
    setMappingToDelete(mapping);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (mappingToDelete) {
      setError(''); // Clear previous errors
      try {
        await MappingLivreurService.deleteMapping(mappingToDelete.id);
        await loadMappings(); // Reload data on success
        setShowDeleteModal(false);
        setMappingToDelete(null);
      } catch (error) {
        setError('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message));
        // Fermer le modal même en cas d'erreur pour éviter qu'il reste bloqué
        setShowDeleteModal(false);
      }
    }
  };

  // --- Handlers pour l'import (inchangés) ---
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setImportMessage('');
    setImportSuccess(false);
  };

  const handleImport = async (e) => { // Utilisation de async/await ici aussi
    e.preventDefault();
    if (!selectedFile) {
      setImportMessage('Veuillez sélectionner un fichier.');
      setImportSuccess(false);
      return;
    }
    if (!selectedFile.name.endsWith('.xlsx')) {
      setImportMessage('Seuls les fichiers Excel (.xlsx) sont acceptés.');
      setImportSuccess(false);
      return;
    }

    setImportLoading(true);
    setImportMessage('');
    try {
      const response = await MappingLivreurService.importMappings(selectedFile);
      setImportMessage(response.data.message || "Importation réussie.");
      setImportSuccess(response.data.success !== undefined ? response.data.success : true); // Assumer succès si non spécifié
      await loadMappings(); // Recharger les données
      // Réinitialiser après un court délai pour voir le message
      setTimeout(() => {
          setShowImportModal(false); // Fermer le modal
          setImportMessage('');
          setSelectedFile(null);
          if (document.getElementById('importFile')) {
              document.getElementById('importFile').value = '';
          }
      }, 2000); // Ferme après 2 secondes
    } catch (error) {
      let errorMessage = 'Erreur lors de l\'importation.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setImportMessage(errorMessage);
      setImportSuccess(false);
    } finally {
      setImportLoading(false);
    }
  };

  // --- Rendu JSX ---
  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Table des Livreurs</h5>
          <div>
            <ActionButton
              icon="fa-plus"
              variant="primary"
              onClick={handleShowAddModal}
              title="Ajouter un nouveau livreur"
              label="Ajouter"
            />
            <ActionButton
              icon="fa-file-import"
              variant="success"
              onClick={() => setShowImportModal(true)}
              title="Importer des livreurs"
              label="Importer"
            />
          </div>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Champ de recherche */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher par nom, prestataire ou ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading} // Désactiver pendant le chargement
            />
          </div>

          {loading ? (
            <div className="text-center my-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-hover">
                <thead className="table-dark"> {/* En-tête sombre */}
                  <tr>
                    <th>Nom du Livreur</th>
                    <th>Prestataire</th>
                    <th>Ville</th>
                    <th>Type de Stock</th>
                    <th className="text-center">Actions</th> {/* Centrer */}
                  </tr>
                </thead>
                <tbody>
                  {/* Utiliser filteredMappings */}
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4"> {/* Plus d'espace */}
                        {searchTerm ? `Aucun livreur trouvé pour "${searchTerm}"` : 'Aucun mapping de livreur trouvé'}
                      </td>
                    </tr>
                  ) : (
                    /* Utiliser filteredMappings */
                    filteredMappings.map(mapping => (
                      <tr key={mapping.id}>
                        <td>{mapping.nomLivreur}</td>
                        <td>{mapping.prestataire}</td>
                        <td>{mapping.ville}</td>
                        <td>{mapping.typeStock}</td>
                        <td className="text-center"> {/* Centrer */}
                          <div className="btn-group btn-group-sm"> {/* btn-group */}
                            <ActionButton
                              icon="fa-edit"
                              variant="outline-warning" // Outline
                              onClick={() => handleShowEditModal(mapping)}
                              title="Modifier le livreur"
                              label="" // Label vide
                            />
                            <ActionButton
                              icon="fa-trash"
                              variant="outline-danger" // Outline
                              onClick={() => confirmDelete(mapping)}
                              title="Supprimer le livreur"
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

      {/* --- Modals (JSX inchangé, mais leur logique JS a été adaptée) --- */}

      {/* Modal d'ajout/édition de mapping */}
      {showModal && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalTitle}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Affichage d'erreur spécifique au modal si nécessaire */}
                  {/* {modalError && <div className="alert alert-danger">{modalError}</div>} */}
                  <div className="mb-3">
                    <label htmlFor="nomLivreur" className="form-label">Nom du Livreur <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="nomLivreur"
                      name="nomLivreur"
                      value={formData.nomLivreur}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="prestataire" className="form-label">Prestataire <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="prestataire"
                      name="prestataire"
                      value={formData.prestataire}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="ville" className="form-label">Ville <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="ville"
                      name="ville"
                      value={formData.ville}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="typeStock" className="form-label">Type de Stock <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      id="typeStock"
                      name="typeStock"
                      value={formData.typeStock}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="REPRESENTANT">REPRESENTANT</option>
                      <option value="ENTREPOT">ENTREPOT</option>
                      <option value="PRESTATAIRE">PRESTATAIRE</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <ActionButton
                    icon="fa-times"
                    variant="secondary"
                    onClick={handleCloseModal}
                    title="Annuler"
                    label="Annuler"
                  />
                  <ActionButton
                    type="submit"
                    icon={currentMapping ? "fa-save" : "fa-plus"}
                    variant="primary"
                    title={currentMapping ? "Mettre à jour" : "Ajouter"}
                    label={currentMapping ? "Mettre à jour" : "Ajouter"}
                    // Optionnel: désactiver pendant la soumission
                    // disabled={isSubmitting}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showModal && <div className="modal-backdrop fade show"></div>}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmation de suppression</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                Êtes-vous sûr de vouloir supprimer ce mapping de livreur ?
                {mappingToDelete && (
                  <p className="mt-2 fw-bold">
                    {mappingToDelete.nomLivreur} - {mappingToDelete.prestataire} ({mappingToDelete.ville})
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <ActionButton
                  icon="fa-times"
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                  title="Annuler"
                  label="Annuler"
                />
                <ActionButton
                  icon="fa-trash"
                  variant="danger"
                  onClick={handleDelete}
                  title="Confirmer la suppression"
                  label="Supprimer"
                   // Optionnel: désactiver pendant la suppression
                   // disabled={isDeleting}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}

      {/* Modal d'importation */}
      {showImportModal && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Importer des Mappings Livreurs</h5>
                <button type="button" className="btn-close" onClick={() => { setShowImportModal(false); setImportMessage(''); setSelectedFile(null); }}></button>
              </div>
              <form onSubmit={handleImport}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="importFile" className="form-label">Fichier Excel (.xlsx) <span className="text-danger">*</span></label>
                    <input
                      type="file"
                      className="form-control"
                      id="importFile"
                      onChange={handleFileChange}
                      accept=".xlsx"
                      required
                    />
                    <div className="form-text text-muted">
                      Colonnes attendues : Nom Livreur, Prestataire, Ville, Type Stock (optionnel, défaut: REPRESENTANT)
                    </div>
                  </div>
                  {importMessage && (
                    <div className={`alert ${importSuccess ? "alert-success" : "alert-danger"} mt-2 py-2`}>
                      {importMessage}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <ActionButton
                    icon="fa-times"
                    variant="secondary"
                    onClick={() => { setShowImportModal(false); setImportMessage(''); setSelectedFile(null); }}
                    title="Fermer"
                    label="Fermer"
                    disabled={importLoading}
                  />
                  <ActionButton
                    type="submit"
                    icon="fa-upload"
                    variant="primary"
                    title="Importer les données"
                    label={importLoading ? "Importation..." : "Importer"}
                    disabled={importLoading || !selectedFile}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showImportModal && <div className="modal-backdrop fade show"></div>}

    </div>
  );
};

export default MappingLivreurList;
