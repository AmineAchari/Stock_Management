import React, { useState, useEffect } from 'react';
import MappingLivreurService from '../../services/mapping-livreur.service';

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

const MappingLivreurList = () => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // État pour le modal d'édition/création
  const [showModal, setShowModal] = useState(false);
  const [currentMapping, setCurrentMapping] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  
  // État pour le modal de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState(null);
  
  // État pour le modal d'importation
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importMessage, setImportMessage] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  
  // État pour le formulaire
  const [formData, setFormData] = useState({
    nomLivreur: '',
    prestataire: '',
    ville: '',
    typeStock: 'REPRESENTANT'
  });
  
  const loadMappings = () => {
    setLoading(true);
    setError('');
    
    MappingLivreurService.getAllMappings()
      .then(response => {
        setMappings(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError('Erreur lors du chargement des mappings: ' + (error.response?.data?.message || error.message));
        setLoading(false);
      });
  };
  
  useEffect(() => {
    loadMappings();
  }, []);
  
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentMapping(null);
    setFormData({
      nomLivreur: '',
      prestataire: '',
      ville: '',
      typeStock: 'REPRESENTANT'
    });
  };
  
  const handleShowAddModal = () => {
    setCurrentMapping(null);
    setModalTitle('Ajouter un mapping de livreur');
    setFormData({
      nomLivreur: '',
      prestataire: '',
      ville: '',
      typeStock: 'REPRESENTANT'
    });
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentMapping) {
      // Mise à jour d'un mapping existant
      MappingLivreurService.updateMapping(currentMapping.id, formData)
        .then(() => {
          loadMappings();
          handleCloseModal();
        })
        .catch(error => {
          setError('Erreur lors de la mise à jour: ' + (error.response?.data?.message || error.message));
        });
    } else {
      // Création d'un nouveau mapping
      MappingLivreurService.createMapping(formData)
        .then(() => {
          loadMappings();
          handleCloseModal();
        })
        .catch(error => {
          setError('Erreur lors de la création: ' + (error.response?.data?.message || error.message));
        });
    }
  };
  
  const confirmDelete = (mapping) => {
    setMappingToDelete(mapping);
    setShowDeleteModal(true);
  };
  
  const handleDelete = () => {
    if (mappingToDelete) {
      MappingLivreurService.deleteMapping(mappingToDelete.id)
        .then(() => {
          loadMappings();
          setShowDeleteModal(false);
          setMappingToDelete(null);
        })
        .catch(error => {
          setError('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message));
          setShowDeleteModal(false);
        });
    }
  };
  
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setImportMessage('');
    setImportSuccess(false);
  };
  
  const handleImport = (e) => {
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
    
    MappingLivreurService.importMappings(selectedFile)
      .then(response => {
        setImportMessage(response.data.message);
        setImportSuccess(response.data.success);
        loadMappings();
        setImportLoading(false);
        // Réinitialiser le champ de fichier
        document.getElementById('importFile').value = '';
        setSelectedFile(null);
      })
      .catch(error => {
        let errorMessage = 'Erreur lors de l\'importation.';
        if (error.response && error.response.data) {
          errorMessage = error.response.data.message || errorMessage;
        }
        setImportMessage(errorMessage);
        setImportSuccess(false);
        setImportLoading(false);
      });
  };
  
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
          
          {loading ? (
            <div className="text-center my-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Nom du Livreur</th>
                    <th>Prestataire</th>
                    <th>Ville</th>
                    <th>Type de Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Aucun mapping de livreur trouvé
                      </td>
                    </tr>
                  ) : (
                    mappings.map(mapping => (
                      <tr key={mapping.id}>
                        <td>{mapping.nomLivreur}</td>
                        <td>{mapping.prestataire}</td>
                        <td>{mapping.ville}</td>
                        <td>{mapping.typeStock}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <ActionButton
                              icon="fa-edit"
                              variant="warning"
                              onClick={() => handleShowEditModal(mapping)}
                              title="Modifier le livreur"
                              label="Modifier"
                            />
                            <ActionButton
                              icon="fa-trash"
                              variant="danger"
                              onClick={() => confirmDelete(mapping)}
                              title="Supprimer le livreur"
                              label="Supprimer"
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
                  <div className="mb-3">
                    <label htmlFor="nomLivreur" className="form-label">Nom du Livreur</label>
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
                    <label htmlFor="prestataire" className="form-label">Prestataire</label>
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
                    <label htmlFor="ville" className="form-label">Ville</label>
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
                    <label htmlFor="typeStock" className="form-label">Type de Stock</label>
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
                    title="Annuler les modifications"
                    label="Annuler"
                  />
                  <ActionButton
                    type="submit"
                    icon={currentMapping ? "fa-save" : "fa-plus"}
                    variant="primary"
                    title={currentMapping ? "Mettre à jour le livreur" : "Ajouter le livreur"}
                    label={currentMapping ? "Mettre à jour" : "Ajouter"}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay pour le modal */}
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
                  title="Annuler la suppression"
                  label="Annuler"
                />
                <ActionButton
                  icon="fa-trash"
                  variant="danger"
                  onClick={handleDelete}
                  title="Confirmer la suppression"
                  label="Supprimer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay pour le modal de suppression */}
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}
      
      {/* Modal d'importation */}
      {showImportModal && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Importer des Mappings Livreurs</h5>
                <button type="button" className="btn-close" onClick={() => setShowImportModal(false)}></button>
              </div>
              <form onSubmit={handleImport}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="importFile" className="form-label">Fichier Excel</label>
                    <input 
                      type="file" 
                      className="form-control"
                      id="importFile"
                      onChange={handleFileChange}
                      accept=".xlsx"
                      required
                    />
                    <div className="form-text text-muted">
                      Le fichier doit être au format Excel (.xlsx)
                    </div>
                  </div>
                  
                  {importMessage && (
                    <div className={`alert ${importSuccess ? "alert-success" : "alert-danger"}`}>
                      {importMessage}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <ActionButton
                    icon="fa-times"
                    variant="secondary"
                    onClick={() => setShowImportModal(false)}
                    title="Fermer le modal"
                    label="Fermer"
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
      
      {/* Overlay pour le modal d'importation */}
      {showImportModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default MappingLivreurList;