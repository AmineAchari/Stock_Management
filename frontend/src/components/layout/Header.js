import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthService from "../../services/auth.service";

const Header = () => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const navigate = useNavigate();
  const location = useLocation();

  // Vérifier l'utilisateur à chaque changement de route et au montage du composant
  useEffect(() => {
    const checkUser = () => {
      const user = AuthService.getCurrentUser();
      setCurrentUser(user);
    };

    // Création d'un événement personnalisé pour la connexion/déconnexion
    window.addEventListener("auth-change", checkUser);
    
    // Vérifier à chaque changement de route
    checkUser();

    return () => {
      window.removeEventListener("auth-change", checkUser);
    };
  }, [location]);

  const logOut = (e) => {
    e.preventDefault();
    AuthService.logout();
    setCurrentUser(undefined);
    
    // Déclencher l'événement auth-change pour informer tous les composants
    window.dispatchEvent(new Event("auth-change"));
    
    navigate("/login");
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    if (AuthService.isAuthenticated()) {
      navigate("/stocks");
    } else {
      navigate("/login");
    }
  };

  return (
    <nav className="navbar navbar-expand-sm navbar-dark bg-dark py-2">
      <div className="container-fluid px-2">
        <a href="#" className="navbar-brand py-0 my-1 small" style={{fontSize: '1.3rem'}} onClick={handleBrandClick}>
          Gestion des Stocks
        </a>
        <button
          className="navbar-toggler btn-sm py-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{height: '20px', width: '24px'}}
        >
          <span className="navbar-toggler-icon" style={{height: '14px', width: '14px'}}></span>
        </button>
        <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
          {currentUser && (
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <Link to="/produits" className="nav-link py-0 my-1 small" style={{fontSize: '1rem'}}>
                  Produits
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/stocks" className="nav-link py-0 my-1 small" style={{fontSize: '1rem'}}>
                  Stocks
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/affectation" className="nav-link py-0 my-1 small" style={{fontSize: '1rem'}}>
                Affectation des produits
                </Link>
              </li>
            </ul>
          )}

          {currentUser ? (
            <ul className="navbar-nav ms-auto" style={{position: 'absolute', right: '8px'}}>
              <li className="nav-item">
                <span className="nav-link py-0 my-1 small" style={{fontSize: '1rem'}}>
                  {currentUser.username || currentUser.nomUtilisateur}
                </span>
              </li>
              <li className="nav-item">
                <a href="#" className="nav-link py-0 my-1 small" style={{fontSize: '1rem'}} onClick={logOut}>
                  Déconnexion
                </a>
              </li>
            </ul>
          ) : (
            <ul className="navbar-nav ms-auto" style={{position: 'absolute', right: '8px'}}>
              <li className="nav-item">
                <Link to="/login" className="nav-link py-0 my-1 small" style={{fontSize: '1rem'}}>
                  Connexion
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link py-0 my-1 small" style={{fontSize: '1rem'}}>
                  Inscription
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;