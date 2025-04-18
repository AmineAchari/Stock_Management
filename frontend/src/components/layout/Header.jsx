import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthService from "../../services/auth.service"; // Assure-toi que le chemin est correct

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

    // Écouter l'événement personnalisé pour la connexion/déconnexion
    window.addEventListener("auth-change", checkUser);

    // Vérifier au montage et à chaque changement de route
    checkUser();

    return () => {
      window.removeEventListener("auth-change", checkUser);
    };
  }, [location]); // Dépendance sur location pour re-vérifier si l'URL change

  const logOut = (e) => {
    e.preventDefault(); // Toujours utile même sur un bouton pour éviter des comportements par défaut potentiels
    AuthService.logout();
    setCurrentUser(undefined); // Mise à jour locale immédiate

    // L'événement auth-change est déjà déclenché dans AuthService.logout()
    // window.dispatchEvent(new Event("auth-change")); // Redondant si déjà dans logout()

    navigate("/login");
  };

  const handleBrandClick = (e) => {
    e.preventDefault(); // Toujours utile
    if (AuthService.isAuthenticated()) {
      navigate("/stocks");
    } else {
      navigate("/login");
    }
  };

  // Helper pour créer les liens de navigation réels avec icônes
  const NavLinkWithIcon = ({ to, icon, label }) => (
    <li className="nav-item">
      <Link to={to} className="nav-link py-0 my-1 small d-flex align-items-center" style={{ fontSize: '1rem' }}>
        <i className={`fas ${icon} me-2`}></i> {/* Icône avec marge à droite */}
        {label}
      </Link>
    </li>
  );

  // Style pour faire ressembler un bouton à un lien de navbar
  const buttonLinkStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'rgba(255, 255, 255, 0.55)', // Couleur par défaut des liens navbar-dark
    cursor: 'pointer',
    textDecoration: 'none', // Enlever le soulignement par défaut des boutons
    display: 'flex',       // Pour aligner l'icône et le texte
    alignItems: 'center',  // Pour aligner l'icône et le texte
    fontSize: '1rem'       // Correspondre à la taille des autres liens
  };

  const buttonLinkHoverStyle = {
    color: 'rgba(255, 255, 255, 0.75)', // Couleur au survol
  };

  return (
    <nav className="navbar navbar-expand-sm navbar-dark bg-dark py-2">
      <div className="container-fluid px-2">
        {/* --- Brand (Utilisation d'un bouton) --- */}
        <button
          type="button"
          className="navbar-brand py-0 my-1 small d-flex align-items-center"
          style={{ ...buttonLinkStyle, fontSize: '1.3rem', color: '#fff' }} // Style de base + couleur blanche pour la marque
          onMouseOver={(e) => e.currentTarget.style.color = buttonLinkHoverStyle.color}
          onMouseOut={(e) => e.currentTarget.style.color = '#fff'} // Retour à blanc
          onClick={handleBrandClick}
        >
          <i className="fas fa-boxes-stacked me-2"></i> {/* Icône pour la marque */}
          Gestion Stocks
        </button>

        {/* --- Toggler --- */}
        <button
          className="navbar-toggler btn-sm py-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ height: '20px', width: '24px' }}
        >
          <span className="navbar-toggler-icon" style={{ height: '14px', width: '14px' }}></span>
        </button>

        {/* --- Collapse --- */}
        <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
          {/* --- Liens principaux (si connecté) --- */}
          {currentUser && (
            <ul className="navbar-nav mx-auto">
              <NavLinkWithIcon to="/dashboard" icon="fa-tachometer-alt" label="Dashboard" />
              <NavLinkWithIcon to="/stocks" icon="fa-warehouse" label="Stocks" />
              <NavLinkWithIcon to="/produits" icon="fa-tags" label="Produits" />
              <NavLinkWithIcon to="/mapping-livreurs" icon="fa-truck" label="Livreurs" />
              <NavLinkWithIcon to="/affectation" icon="fa-exchange-alt" label="Affectation" />
              <NavLinkWithIcon to="/import/livraisons" icon="fa-file-import" label="Importation" />
              <NavLinkWithIcon to="/stocks/rapport" icon="fa-chart-line" label="Rapport" />
            </ul>
          )}

          {/* --- Liens d'authentification --- */}
          {currentUser ? (
            <ul className="navbar-nav ms-auto" style={{ position: 'absolute', right: '8px' }}>
              <li className="nav-item">
                {/* Affichage du nom utilisateur (pas un lien/bouton) */}
                <span className="nav-link py-0 my-1 small d-flex align-items-center" style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.55)' }}>
                  <i className="fas fa-user me-2"></i> {/* Icône utilisateur */}
                  {currentUser.username || currentUser.nomUtilisateur}
                </span>
              </li>
              <li className="nav-item">
                {/* Bouton de déconnexion */}
                <button
                  type="button"
                  className="nav-link py-0 my-1 small" // Utilise la classe nav-link pour le padding/margin
                  style={buttonLinkStyle}
                  onMouseOver={(e) => e.currentTarget.style.color = buttonLinkHoverStyle.color}
                  onMouseOut={(e) => e.currentTarget.style.color = buttonLinkStyle.color}
                  onClick={logOut}
                >
                  <i className="fas fa-sign-out-alt me-2"></i> {/* Icône déconnexion */}
                  Déconnexion
                </button>
              </li>
            </ul>
          ) : (
            <ul className="navbar-nav ms-auto" style={{ position: 'absolute', right: '8px' }}>
              {/* Liens réels vers Connexion/Inscription */}
              <li className="nav-item">
                <Link to="/login" className="nav-link py-0 my-1 small d-flex align-items-center" style={{ fontSize: '1rem' }}>
                  <i className="fas fa-sign-in-alt me-2"></i> {/* Icône connexion */}
                  Connexion
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link py-0 my-1 small d-flex align-items-center" style={{ fontSize: '1rem' }}>
                  <i className="fas fa-user-plus me-2"></i> {/* Icône inscription */}
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
