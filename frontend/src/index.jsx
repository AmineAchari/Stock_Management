// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importe le App modifié (qui inclut ProSidebarProvider)
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App /> {/* App contient déjà le Provider */}
    </BrowserRouter>
  </React.StrictMode>
);
