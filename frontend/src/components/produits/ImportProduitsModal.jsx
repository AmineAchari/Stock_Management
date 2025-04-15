import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ImportService from '../../services/import.service';

const ImportProduitsModal = ({ show, onClose, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importMessage, setImportMessage] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.match(/\.(xlsx|xls)$/)) {
      setImportMessage('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés');
      setImportSuccess(false);
      return;
    }
    setSelectedFile(file);
    setImportMessage('');
    setImportSuccess(false);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setImportMessage('Veuillez sélectionner un fichier.');
      return;
    }

    setImportLoading(true);
    
    try {
      const response = await ImportService.importProduits(selectedFile);
      
      if (response.data.success) {
        setImportMessage(`Import réussi. ${response.data.totalImportes || 0} produits importés.`);
        setImportSuccess(true);
        if (onImportSuccess) {
          onImportSuccess();
        }
        // Reset form
        if (document.getElementById('importFile')) {
          document.getElementById('importFile').value = '';
        }
        setSelectedFile(null);
      } else {
        throw new Error(response.data?.message || 'Erreur lors de l\'importation');
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Erreur lors de l\'importation';
      setImportMessage(errorMessage);
      setImportSuccess(false);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} backdrop="static" keyboard={false}>
      <form onSubmit={handleImport}>
        <Modal.Header closeButton>
          <Modal.Title>Importer des Produits</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="importFile" className="form-label">
              Fichier Excel (.xlsx, .xls)
            </label>
            <input
              type="file"
              className="form-control"
              id="importFile"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              required
            />
          </div>

          {importMessage && (
            <div className={`alert ${importSuccess ? 'alert-success' : 'alert-danger'}`}>
              {importMessage}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={importLoading || !selectedFile}
          >
            {importLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Importation...
              </>
            ) : (
              'Importer'
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default ImportProduitsModal;