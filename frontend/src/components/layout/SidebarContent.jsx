// src/components/layout/SidebarContent.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthService from "../../services/auth.service";
// Ne plus importer useProSidebar
import { Menu, MenuItem } from 'react-pro-sidebar';

// Recevoir 'collapsed' comme prop
const SidebarContent = ({ collapsed }) => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const navigate = useNavigate();
  const location = useLocation();
  // Supprimer l'appel à useProSidebar
  // const { collapsed } = useProSidebar(); // SUPPRIMÉ

  useEffect(() => {
    const checkUser = () => {
      const user = AuthService.getCurrentUser();
      setCurrentUser(user);
    };
    window.addEventListener("auth-change", checkUser);
    checkUser();
    return () => {
      window.removeEventListener("auth-change", checkUser);
    };
  }, [location]);

  const logOut = () => {
    AuthService.logout();
    navigate("/login");
  };

  const SidebarMenuItemLink = ({ to, icon, label }) => (
    <MenuItem
      icon={<i className={`fas ${icon}`} />}
      component={<Link to={to} />}
      style={{ color: 'rgba(255, 255, 255, 0.8)' }}
    >
      {label}
    </MenuItem>
  );

  const menuItemStyles = {
    button: {
      color: 'rgba(255, 255, 255, 0.8)',
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#fff',
      },
    },
    icon: {
      color: 'rgba(255, 255, 255, 0.6)',
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header - utilise la prop 'collapsed' */}
      <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <h5 style={{ color: '#fff', margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <i className={`fas fa-boxes-stacked ${!collapsed ? 'me-2' : ''}`}></i>
            {!collapsed && <span>Gestion Stocks</span>}
          </h5>
        </Link>
      </div>

      {/* Menu - utilise la prop 'collapsed' */}
      <div className="sidebar-menu-scrollable" style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Menu menuItemStyles={menuItemStyles}>
          {currentUser && (
            <>
              <SidebarMenuItemLink to="/dashboard" icon="fa-tachometer-alt" label={!collapsed ? "Dashboard" : ""} />
              <SidebarMenuItemLink to="/stocks" icon="fa-warehouse" label={!collapsed ? "Stocks" : ""} />
              <SidebarMenuItemLink to="/produits" icon="fa-tags" label={!collapsed ? "Produits" : ""} />
              <SidebarMenuItemLink to="/mapping-livreurs" icon="fa-truck" label={!collapsed ? "Livreurs" : ""} />
              <SidebarMenuItemLink to="/affectation" icon="fa-exchange-alt" label={!collapsed ? "Affectation" : ""} />
              <SidebarMenuItemLink to="/import/livraisons" icon="fa-file-import" label={!collapsed ? "Importation" : ""} />
              {/* <SidebarMenuItemLink to="/stocks/rapport" icon="fa-chart-line" label={!collapsed ? "Rapport Stock" : ""} /> */}
              <SidebarMenuItemLink to="/reports/location" icon="fa-map-location-dot" label={!collapsed ? "Rapport Localisation" : ""} />
            </>
          )}
           {!currentUser && !collapsed && (
             <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
               Veuillez vous connecter.
             </div>
           )}
        </Menu>
      </div>

      {/* Auth Section - utilise la prop 'collapsed' */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 'auto', padding: '10px 0', flexShrink: 0 }}>
        <Menu menuItemStyles={menuItemStyles}>
          {currentUser ? (
            <>
              <MenuItem icon={<i className="fas fa-user" />} style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {!collapsed ? (currentUser.username || currentUser.nomUtilisateur) : ''}
              </MenuItem>
              <MenuItem
                icon={<i className="fas fa-sign-out-alt" />}
                onClick={logOut}
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                {!collapsed ? 'Déconnexion' : ''}
              </MenuItem>
            </>
          ) : (
            <>
              <SidebarMenuItemLink to="/login" icon="fa-sign-in-alt" label={!collapsed ? 'Connexion' : ''} />
              <SidebarMenuItemLink to="/register" icon="fa-user-plus" label={!collapsed ? 'Inscription' : ''} />
            </>
          )}
        </Menu>
      </div>
    </div>
  );
};

export default SidebarContent;
