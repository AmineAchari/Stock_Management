import React, { useState } from 'react';
import ImportService from '../../services/import.service';

const ImportLivraisons = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [result, setResult] = useState(null);
  
  // Nouveaux états pour les paramètres d'importation
  const [pays, setPays] = useState("");
  const [ville, setVille] = useState("");
  const [date, setDate] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage("");
    setIsError(false);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setMessage("Veuillez sélectionner un fichier Excel (.xlsx, .xls)");
      setIsError(true);
      return;
    }
    
    setLoading(true);
    setMessage("");
    setIsError(false);
    setResult(null);
    
    const options = {
      pays: pays.trim(),
      ville: ville.trim(),
      date: date.trim()
    };
    
    try {
      const response = await ImportService.importLivraisons(selectedFile, options);
      console.log('Response complète:', response);
      
      // Vérifier si nous avons une réponse valide
      if (!response) {
        throw new Error("Aucune réponse du serveur");
      }

      // La réponse peut être directement les données ou être dans response.data
      const data = response.data || response;
      console.log('Données de réponse:', data);

      if (data) {
        // Extraire les statistiques même si success n'est pas défini
        const resultat = data.resultat || {};
        const statistiquesGlobales = resultat.statistiquesGlobales || {};
        
        setResult({
          totalLignes: statistiquesGlobales.totalLivraisons || 0,
          lignesTraitees: statistiquesGlobales.livraisonsReussies || 0,
          lignesEchouees: statistiquesGlobales.livraisonsEchouees || 0,
          date: resultat.date || new Date().toISOString(),
          paysSpecifie: options.pays,
          villeSpecifiee: options.ville,
          erreurs: resultat.erreurs || [],
          resultatsParPays: resultat.statistiquesParPays || {},
          statistiques: {
            totalProduits: statistiquesGlobales.totalProduits || 0,
            totalQuantite: statistiquesGlobales.quantiteTotal || 0,
            nombreLivreurs: statistiquesGlobales.nombreLivreurs || 0
          }
        });

        setMessage(data.message || "Importation réussie");
        setIsError(false);
        
        // Reset form
        setSelectedFile(null);
        document.getElementById('formFile').value = '';
      } else {
        throw new Error("Format de réponse invalide");
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      let errorMessage;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "Une erreur inattendue s'est produite";
      }
      
      setMessage(errorMessage);
      setIsError(true);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header">
          <h5>Importation des Livraisons</h5>
        </div>
        <div className="card-body">
          <p className="card-text">
            Importez un fichier Excel (.xlsx, .xls) contenant les données des livraisons à traiter.
            Vous pouvez spécifier le pays, la ville et la date pour l'ensemble des données importées.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-12">
                <label htmlFor="formFile" className="form-label">Fichier Excel <span className="text-danger">*</span></label>
                <input 
                  className="form-control" 
                  type="file" 
                  id="formFile"
                  onChange={handleFileChange}
                  accept=".xlsx,.xls"
                  required
                />
                <div className="form-text text-muted">
                  Le fichier doit contenir les colonnes : Livreur, Nom Produit, Quantité
                </div>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-4">
                <label htmlFor="pays" className="form-label">Pays (optionnel)</label>
                <input
                  type="text"
                  className="form-control"
                  id="pays"
                  value={pays}
                  onChange={(e) => setPays(e.target.value)}
                  placeholder="Ex: RDC, Maroc"
                />
                <div className="form-text text-muted">
                  Si spécifié, remplace le pays détecté automatiquement
                </div>
              </div>
              
              <div className="col-md-4">
                <label htmlFor="ville" className="form-label">Ville (optionnel)</label>
                <input
                  type="text"
                  className="form-control"
                  id="ville"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Ex: Kinshasa, Casablanca"
                />
                <div className="form-text text-muted">
                  Si spécifié, remplace la ville du mapping du livreur
                </div>
              </div>
              
              <div className="col-md-4">
                <label htmlFor="date" className="form-label">Date (optionnel)</label>
                <input
                  type="date"
                  className="form-control"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <div className="form-text text-muted">
                  Si non spécifié, utilise la date du jour
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              type="submit"
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Importation en cours...
                </>
              ) : 'Importer'}
            </button>
          </form>
          
          {loading && (
            <div className="progress mt-3">
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style={{width: "100%"}}
              ></div>
            </div>
          )}
          
          {message && (
            <div className={`alert ${isError ? "alert-danger" : "alert-success"} mt-3`}>
              {message}
            </div>
          )}
          
          {result && (
            <div className="mt-4">
              <h5>Résultat de l'importation</h5>
              
              {/* Statistiques globales */}
              <div className="row">
                <div className="col-md-4">
                  <div className="card bg-light mb-3">
                    <div className="card-body text-center">
                      <h3>{result.statistiques?.totalProduits || 0}</h3>
                      <p className="mb-0">Produits traités</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light mb-3">
                    <div className="card-body text-center">
                      <h3>{result.statistiques?.totalQuantite || 0}</h3>
                      <p className="mb-0">Quantité totale</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light mb-3">
                    <div className="card-body text-center">
                      <h3>{result.statistiques?.nombreLivreurs || 0}</h3>
                      <p className="mb-0">Livreurs concernés</p>
                    </div>
                  </div>
                </div>
              </div>
          
              {/* Tableau détaillé */}
              <div className="card mb-4">
                <div className="card-body">
                  <table className="table table-striped table-bordered table-sm">
                    <tbody>
                      <tr>
                        <td width="200">Total des lignes</td>
                        <td>{result.totalLignes}</td>
                      </tr>
                      <tr>
                        <td>Lignes traitées</td>
                        <td className="text-success">{result.lignesTraitees}</td>
                      </tr>
                      <tr>
                        <td>Lignes en échec</td>
                        <td className="text-danger">{result.lignesEchouees}</td>
                      </tr>
                      <tr>
                        <td>Date d'importation</td>
                        <td>{new Date(result.date).toLocaleString()}</td>
                      </tr>
                      {result.paysSpecifie && (
                        <tr>
                          <td>Pays spécifié</td>
                          <td>{result.paysSpecifie}</td>
                        </tr>
                      )}
                      {result.villeSpecifiee && (
                        <tr>
                          <td>Ville spécifiée</td>
                          <td>{result.villeSpecifiee}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {result.erreurs && result.erreurs.length > 0 && (
                <div className="mt-3 mb-4">
                  <h6>Erreurs détectées:</h6>
                  <ul className="list-group">
                    {result.erreurs.map((erreur, index) => (
                      <li key={index} className="list-group-item list-group-item-danger">
                        {erreur}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportLivraisons;