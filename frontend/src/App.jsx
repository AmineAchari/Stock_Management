// src/App.jsx
import React, { useState } from "react"; // Ajout de useState et useEffect
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
// Ne plus importer ProSidebarProvider et useProSidebar
import { Sidebar } from 'react-pro-sidebar';

import SidebarContent from "./components/layout/SidebarContent";
import AuthService from "./services/auth.service";
// --- Imports des composants de page ---
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Dashboard from "./components/dashboard/Dashboard";
import StockList from "./components/stocks/StockList";
import StockDetail from "./components/stocks/StockDetail";
import StockForm from "./components/stocks/StockForm";
import StocksReport from "./components/stocks/StocksReport";
import ProduitList from "./components/produits/ProduitList";
import ProduitDetail from "./components/produits/ProduitDetail";
import ProduitForm from "./components/produits/ProduitForm";
import AffectationProduit from './components/affectation/AffectationProduit';
import ImportLivraisons from "./components/import/ImportLivraisons";
import MappingLivreurList from "./components/mapping-livreur/MappingLivreurList";
import LocationStockReport from "./components/stocks/LocationStockReport";
// --- Fin Imports ---

const PrivateRoute = ({ children }) => {
  return AuthService.isAuthenticated() ? children : <Navigate to="/login" />;
};

// AppContent gère maintenant l'état de la sidebar
function AppContent() {
  // États pour contrôler la sidebar
  const [collapsed, setCollapsed] = useState(false);
  const [toggled, setToggled] = useState(false); // Pour le mode mobile/burger
  const [broken, setBroken] = useState(false); // Pour savoir si on est en mode mobile (basé sur breakpoint)

  // Fonctions pour contrôler l'état
  const handleToggleSidebar = () => {
    setToggled(!toggled);
  };

  const handleCollapseSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Callback pour la prop onBreakPoint de Sidebar
  const handleBroken = (isBroken) => {
    setBroken(isBroken);
    // Optionnel: Fermer la sidebar si on passe de mobile à desktop
    if (!isBroken) {
      setToggled(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        backgroundColor="#212529"
        rootStyles={{
          color: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
        collapsed={collapsed} // Passe l'état collapsed
        toggled={toggled}     // Passe l'état toggled
        onBackdropClick={handleToggleSidebar} // Gère le clic hors sidebar en mode mobile
        onBreakPoint={handleBroken} // Détecte le passage en mode mobile
        breakPoint="md" // Définit la largeur pour le mode mobile
      >
        {/* Passe l'état collapsed à SidebarContent */}
        <SidebarContent collapsed={collapsed} />
      </Sidebar>

      <main style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f8f9fa' }}>
        {/* Boutons de contrôle */}
        {/* Affiche le bouton burger seulement en mode mobile (broken=true) */}
        {broken && (
          <button className="btn btn-light mb-3" onClick={handleToggleSidebar}>
             <i className="fas fa-bars"></i>
          </button>
        )}
        {/* Affiche le bouton collapse/expand seulement en mode desktop (broken=false) */}
        {!broken && (
          <button className="btn btn-light mb-3" onClick={handleCollapseSidebar}>
             <i className={`fas ${collapsed ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
          </button>
        )}

        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes protégées */}
          <Route path="/" element={AuthService.isAuthenticated() ? <Navigate replace to="/dashboard" /> : <Navigate replace to="/login" />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/stocks" element={<PrivateRoute><StockList /></PrivateRoute>} />
          <Route path="/stocks/new" element={<PrivateRoute><StockForm /></PrivateRoute>} />
          <Route path="/stocks/edit/:id" element={<PrivateRoute><StockForm /></PrivateRoute>} />
          <Route path="/stocks/:id" element={<PrivateRoute><StockDetail /></PrivateRoute>} />
          <Route path="/stocks/rapport" element={<PrivateRoute><StocksReport /></PrivateRoute>} />
          <Route path="/produits" element={<PrivateRoute><ProduitList /></PrivateRoute>} />
          <Route path="/produits/new" element={<PrivateRoute><ProduitForm /></PrivateRoute>} />
          <Route path="/produits/edit/:id" element={<PrivateRoute><ProduitForm /></PrivateRoute>} />
          <Route path="/produits/:id" element={<PrivateRoute><ProduitDetail /></PrivateRoute>} />
          <Route path="/affectation" element={<PrivateRoute><AffectationProduit /></PrivateRoute>} />
          <Route path="/import/livraisons" element={<PrivateRoute><ImportLivraisons /></PrivateRoute>} />
          <Route path="/mapping-livreurs" element={<PrivateRoute><MappingLivreurList /></PrivateRoute>} />
          <Route path="/reports/location" element={<PrivateRoute><LocationStockReport /></PrivateRoute>} />

          {/* Route par défaut ou 404 */}
          <Route path="*" element={<Navigate to={AuthService.isAuthenticated() ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Ne plus utiliser ProSidebarProvider
const App = () => (
  <AppContent />
);

export default App;
