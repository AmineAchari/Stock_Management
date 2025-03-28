import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ProduitList from "./components/produits/ProduitList";
import ProduitDetail from "./components/produits/ProduitDetail";
import ProduitForm from "./components/produits/ProduitForm";
import StockList from "./components/stocks/StockList";
import StockDetail from "./components/stocks/StockDetail";
import StockForm from "./components/stocks/StockForm";
import AffectationForm from "./components/produit-stock/AffectationForm";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AuthService from "./services/auth.service";

// Composant pour les routes protégées
const PrivateRoute = ({ children }) => {
  return AuthService.isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div>
        <Header />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Navigate replace to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/produits"
              element={
                <PrivateRoute>
                  <ProduitList />
                </PrivateRoute>
              }
            />
            <Route
              path="/produits/:id"
              element={
                <PrivateRoute>
                  <ProduitDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/produits/new"
              element={
                <PrivateRoute>
                  <ProduitForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/produits/edit/:id"
              element={
                <PrivateRoute>
                  <ProduitForm />
                </PrivateRoute>
              }
            />

            <Route
              path="/stocks"
              element={
                <PrivateRoute>
                  <StockList />
                </PrivateRoute>
              }
            />
            <Route
              path="/stocks/:id"
              element={
                <PrivateRoute>
                  <StockDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/stocks/new"
              element={
                <PrivateRoute>
                  <StockForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/affectation"
              element={
                <PrivateRoute>
                  <AffectationForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/stocks/edit/:id"
              element={
                <PrivateRoute>
                  <StockForm />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;