// src/components/auth/Login.jsx ou similaire

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import Link si tu as un lien vers Register
import AuthService from '../../services/auth.service'; // Assure-toi que le chemin est correct

const Login = () => {
  const navigate = useNavigate();
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // --- Redirection si déjà connecté ---
  useEffect(() => {
    // Vérifie si l'utilisateur est déjà authentifié au chargement du composant
    if (AuthService.isAuthenticated()) {
      console.log("Utilisateur déjà connecté. Redirection vers /stocks...");
      navigate('/stocks'); // Redirige vers la page principale après connexion
    }
    // Le tableau de dépendances vide assure que cela ne s'exécute qu'une fois au montage,
    // mais ajouter navigate est une bonne pratique si ESLint le demande.
  }, [navigate]);
  // ------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      // Appel au service d'authentification
      await AuthService.login(nomUtilisateur, motDePasse);

      // Le service AuthService devrait idéalement gérer la sauvegarde du token
      // et potentiellement déclencher un événement global si nécessaire (comme dans Header)

      // Redirection après une connexion réussie
      navigate('/stocks');
      // Optionnel: Forcer un rechargement si la mise à jour de l'état global pose problème
      // window.location.reload();
    } catch (error) {
      // Gestion des erreurs venant de l'API ou autres
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      setMessage(resMessage || "Une erreur est survenue lors de la connexion.");
      setLoading(false);
    }
  };

  // Si l'utilisateur est déjà connecté, on peut retourner null ou un message
  // pour éviter d'afficher le formulaire pendant la redirection rapide.
  // Cependant, la redirection via useEffect est généralement assez rapide.
  // if (AuthService.isAuthenticated()) {
  //   return <p>Vous êtes déjà connecté. Redirection...</p>;
  // }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                {/* Tu peux ajouter un logo ici */}
                <i className="fas fa-user-circle fa-3x text-primary mb-2"></i>
                <h4 className="card-title mb-0">Connexion</h4>
              </div>

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label htmlFor="nomUtilisateur" className="form-label">Nom d'utilisateur</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nomUtilisateur"
                    value={nomUtilisateur}
                    onChange={(e) => setNomUtilisateur(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Entrez votre nom d'utilisateur"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="motDePasse" className="form-label">Mot de passe</label>
                  <input
                    type="password"
                    className="form-control"
                    id="motDePasse"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Entrez votre mot de passe"
                  />
                </div>

                {message && (
                  <div className="alert alert-danger mt-3 py-2" role="alert">
                    {message}
                  </div>
                )}

                <div className="d-grid gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Connexion...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i> Se connecter
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
