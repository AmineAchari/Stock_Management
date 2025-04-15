import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/auth.service";

const Login = () => {
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const onChangeNomUtilisateur = (e) => {
    setNomUtilisateur(e.target.value);
  };

  const onChangeMotDePasse = (e) => {
    setMotDePasse(e.target.value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      console.log("Demande de connexion avec:", nomUtilisateur);
      const userData = await AuthService.login(nomUtilisateur, motDePasse);
      
      if (userData && userData.token) {
        console.log("Authentification réussie avec token");
        
        // Vérification immédiate de l'authentification
        const isAuth = AuthService.isAuthenticated();
        console.log("Authentification vérifiée:", isAuth);
        
        // Déclencher l'événement auth-change pour mettre à jour la navbar
        window.dispatchEvent(new Event("auth-change"));
        
        // Navigation sans recharger la page
        setTimeout(() => {
          navigate("/stocks", { replace: true });
        }, 500);
      } else {
        setMessage("Erreur: Pas de token reçu du serveur");
        setLoading(false);
      }
    } catch (error) {
      console.error("Échec de connexion:", error);
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      setLoading(false);
      setMessage(resMessage);
    }
  };

  return (
    <div className="col-md-12">
      <div className="card card-container">
        <img
          src="//ssl.gstatic.com/accounts/ui/avatar_2x.png"
          alt="profile-img"
          className="profile-img-card"
        />

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="nomUtilisateur">Nom d'utilisateur</label>
            <input
              type="text"
              className="form-control"
              name="nomUtilisateur"
              value={nomUtilisateur}
              onChange={onChangeNomUtilisateur}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="motDePasse">Mot de passe</label>
            <input
              type="password"
              className="form-control"
              name="motDePasse"
              value={motDePasse}
              onChange={onChangeMotDePasse}
              required
            />
          </div>

          <div className="form-group">
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading && (
                <span className="spinner-border spinner-border-sm"></span>
              )}
              <span>Connexion</span>
            </button>
          </div>

          {message && (
            <div className="form-group">
              <div className="alert alert-danger" role="alert">
                {message}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;