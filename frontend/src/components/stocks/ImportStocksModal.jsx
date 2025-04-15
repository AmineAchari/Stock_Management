import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import StockService from '../../services/stock.service';

const ImportStocksModal = ({ show, onClose, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importMessage, setImportMessage] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setImportMessage('Veuillez sélectionner un fichier');
      setImportSuccess(false);
      return;
    }

    setLoading(true);
    try {
      const response = await StockService.importStocks(selectedFile);
      setImportMessage(response.data.message);
      setImportSuccess(true);
      if (onImportSuccess) onImportSuccess();
      
      // Reset form
      setSelectedFile(null);
      document.getElementById('importFile').value = '';
    } catch (error) {
      setImportSuccess(false);
      setImportMessage(error.response?.data?.message || 'Erreur lors de l\'importation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} backdrop="static">
      <form onSubmit={handleImport}>
        <Modal.Header closeButton>
          <Modal.Title>Importer des Stocks</Modal.Title>
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
            <div className="form-text">
              Le fichier doit contenir les colonnes : Nom, Type, Pays, Ville, Adresse
            </div>
          </div>

          {importMessage && (
            <div className={`alert ${importSuccess ? 'alert-success' : 'alert-danger'}`}>
              {importMessage}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading || !selectedFile}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" />
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

export default ImportStocksModal;