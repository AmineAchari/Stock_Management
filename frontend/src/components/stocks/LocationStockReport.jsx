// src/components/reports/LocationStockReport.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiService from '../../services/api.service';
import * as XLSX from 'xlsx';

// Helper function to get current date string
const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const LocationStockReport = () => {
  // États pour les données brutes
  const [allProducts, setAllProducts] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [stockDetailsData, setStockDetailsData] = useState(new Map());

  // États de chargement
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [loadingStockDetails, setLoadingStockDetails] = useState(false);

  // État d'erreur global
  const [error, setError] = useState('');

  // Nouvel état pour le pays sélectionné ('all' par défaut)
  const [selectedCountry, setSelectedCountry] = useState('all');

  // --- FONCTIONS DE FETCH (inchangées) ---
  const fetchAllProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await apiService.getAllProduits();
      setAllProducts(response.data || []);
    } catch (err) {
      console.error("Erreur chargement de tous les produits:", err);
      setError(prev => (prev ? prev + '; ' : '') + "Impossible de charger les noms des produits.");
      setAllProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchAllStocks = useCallback(async () => {
    setLoadingStocks(true);
    try {
      const response = await apiService.getAllStocks();
      setAllStocks(response.data || []);
    } catch (err) {
      console.error("Erreur chargement de tous les stocks:", err);
      setError(prev => (prev ? prev + '; ' : '') + "Impossible de charger la liste des stocks.");
      setAllStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  }, []);

  const fetchStockDetailsForAll = useCallback(async (stocksToFetch) => {
    if (!stocksToFetch || stocksToFetch.length === 0) {
        setLoadingStockDetails(false);
        return;
    }
    setLoadingStockDetails(true);
    setError('');
    console.log(`Fetching details for ${stocksToFetch.length} stocks...`);
    const results = new Map();
    const promises = stocksToFetch.map(async (stock) => {
      try {
        const response = await apiService.getProduitsByStock(stock.id);
        const products = (response.data || []).map(item => ({
            reference: String(item.produit?.reference || item.reference || 'N/A'),
            quantity: Number(item.quantite) || 0
        }));
        results.set(stock.id, { products: products.sort((a, b) => a.reference.localeCompare(b.reference)), error: false });
      } catch (err) {
        console.error(`Erreur chargement produits pour stock ${stock.id} (${stock.nom}):`, err);
        results.set(stock.id, { products: [], error: true });
        setError(prev => (prev ? prev + '; ' : '') + `Erreur chargement stock ${stock.nom}`);
      }
    });
    await Promise.all(promises);
    console.log("Stock details fetched:", results);
    setStockDetailsData(results);
    setLoadingStockDetails(false);
  }, []);

  // --- EFFETS (inchangés) ---
  useEffect(() => {
    fetchAllProducts();
    fetchAllStocks();
  }, [fetchAllProducts, fetchAllStocks]);

  useEffect(() => {
    if (!loadingStocks && allStocks.length > 0 && !loadingStockDetails && stockDetailsData.size === 0) {
      fetchStockDetailsForAll(allStocks);
    }
  }, [allStocks, loadingStocks, fetchStockDetailsForAll, loadingStockDetails, stockDetailsData.size]);

  // --- TRAITEMENT DES DONNÉES (useMemo) ---
  const productMap = useMemo(() => {
    const map = new Map();
    allProducts.forEach(p => {
      if (p.reference) {
        map.set(String(p.reference), p.nom || 'Nom Inconnu');
      }
    });
    return map;
  }, [allProducts]);

  // Données groupées (inchangé, contient tous les pays)
  const reportGrouped = useMemo(() => {
    if (loadingStocks || loadingStockDetails || stockDetailsData.size === 0) return [];
    const grouped = new Map();
    allStocks.forEach(stock => {
      const pays = stock.pays || 'Pays Inconnu';
      const ville = stock.ville || 'Ville Inconnue';
      const stockInfo = { id: stock.id, nom: stock.nom || 'Stock Inconnu' };
      const details = stockDetailsData.get(stock.id);
      if (details && !details.error) {
        const productsWithNames = details.products.map(p => ({ ...p, nom: productMap.get(p.reference) || 'Nom inconnu' }));
        if (!grouped.has(pays)) grouped.set(pays, new Map());
        const villesMap = grouped.get(pays);
        if (!villesMap.has(ville)) villesMap.set(ville, []);
        const stocksArray = villesMap.get(ville);
        stocksArray.push({ stock: stockInfo, products: productsWithNames });
      }
    });
    return Array.from(grouped.entries())
      .map(([pays, villesMap]) => ({
        pays: pays,
        villes: Array.from(villesMap.entries())
                      .map(([ville, stocksArray]) => ({ ville: ville, stocks: stocksArray.sort((a, b) => a.stock.nom.localeCompare(b.stock.nom)) }))
                      .sort((a, b) => a.ville.localeCompare(b.ville))
      }))
      .sort((a, b) => a.pays.localeCompare(b.pays));
  }, [allStocks, stockDetailsData, productMap, loadingStocks, loadingStockDetails]);

  // --- NOUVEAU : Données filtrées pour l'affichage et l'export ---
  const filteredReportData = useMemo(() => {
    if (selectedCountry === 'all') {
      return reportGrouped; // Retourne tout si 'Tous les pays' est sélectionné
    }
    // Filtre pour ne garder que le pays sélectionné
    return reportGrouped.filter(paysData => paysData.pays === selectedCountry);
  }, [reportGrouped, selectedCountry]);

  // --- NOUVEAU : Liste des pays pour le dropdown ---
  const countryOptions = useMemo(() => {
    // Crée un Set pour avoir les pays uniques, puis convertit en tableau et trie
    const uniqueCountries = [...new Set(allStocks.map(s => s.pays || 'Pays Inconnu'))].sort();
    return uniqueCountries;
  }, [allStocks]);

  // --- EXPORT EXCEL (Adapté pour utiliser filteredReportData) ---
  const handleExportExcel = () => {
    // Utilise les données filtrées
    if (!filteredReportData || filteredReportData.length === 0) {
      alert("Aucune donnée à exporter pour la sélection actuelle.");
      return;
    }

    const dataForSheet = [];
    const headers = ["Pays", "Ville", "Stock", "Référence Produit", "Nom Produit", "Quantité"];
    dataForSheet.push(headers);

    // Boucle sur les données filtrées
    filteredReportData.forEach(({ pays, villes }) => {
      villes.forEach(({ ville, stocks }) => {
        stocks.forEach(({ stock, products }) => {
          if (products.length > 0) {
            products.forEach(({ reference, nom, quantity }) => {
              dataForSheet.push([pays, ville, stock.nom, reference, nom, quantity]);
            });
          }
        });
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(dataForSheet);
    const columnWidths = headers.map((_, i) => {
        let maxWidth = 0;
        dataForSheet.forEach(row => {
            const cellValue = row[i];
            const cellLength = cellValue ? String(cellValue).length : 0;
            if (cellLength > maxWidth) { maxWidth = cellLength; }
        });
        return { wch: Math.max(10, maxWidth + 2) };
    });
    ws['!cols'] = columnWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapport Stock Detaille");

    // Nom de fichier dynamique incluant le pays si sélectionné
    const countrySuffix = selectedCountry === 'all' ? 'tous_pays' : selectedCountry.replace(/[^a-zA-Z0-9]/g, '_'); // Remplace caractères non alphanumériques
    const filename = `rapport_stock_${countrySuffix}_${getCurrentDateString()}.xlsx`;
    XLSX.writeFile(wb, filename);
  };
  // --- FIN EXPORT ---

  // État de chargement global
  const isLoading = loadingProducts || loadingStocks || loadingStockDetails;

  // --- CALCUL ROWSPAN (Adapté pour utiliser filteredReportData) ---
  const calculateRowSpans = (reportData) => {
      const spans = { pays: {}, ville: {}, stock: {} };
      // Utilise les données filtrées pour calculer les spans
      reportData.forEach(paysData => {
          let paysRowCount = 0;
          const paysKey = paysData.pays;
          paysData.villes.forEach(villeData => {
              let villeRowCount = 0;
              const villeKey = `${paysKey}-${villeData.ville}`;
              villeData.stocks.forEach(stockData => {
                  const stockRowCount = stockData.products.length || 1;
                  const stockKey = `${villeKey}-${stockData.stock.id}`;
                  spans.stock[stockKey] = stockRowCount;
                  villeRowCount += stockRowCount;
              });
              spans.ville[villeKey] = villeRowCount;
              paysRowCount += villeRowCount;
          });
          spans.pays[paysKey] = paysRowCount;
      });
      return spans;
  };
  // Calcule les spans sur les données filtrées
  const rowSpans = useMemo(() => calculateRowSpans(filteredReportData), [filteredReportData]);
  // --- FIN CALCUL ROWSPAN ---


  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">Rapport Détaillé par Localisation et Stock</h5>
          <div className="d-flex align-items-center gap-2">
            {/* --- NOUVEAU : Sélecteur de Pays --- */}
            <div className="d-flex align-items-center">
              <label htmlFor="countrySelect" className="form-label me-2 mb-0 text-nowrap">Pays:</label>
              <select
                id="countrySelect"
                className="form-select form-select-sm"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                disabled={isLoading || countryOptions.length === 0} // Désactivé si chargement ou pas de pays
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="all">Tous les pays</option>
                {countryOptions.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            {/* --- FIN Sélecteur de Pays --- */}

            {/* Bouton Exporter */}
            <button
              className="btn btn-sm btn-success"
              onClick={handleExportExcel}
              // Désactivé si chargement ou pas de données filtrées
              disabled={isLoading || !filteredReportData || filteredReportData.length === 0}
              title="Exporter le rapport en Excel"
            >
              <i className="fas fa-file-excel me-1"></i> Exporter Excel
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {isLoading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-2">Chargement du rapport...</p>
            </div>
            // Utilise filteredReportData pour l'affichage
          ) : !filteredReportData || filteredReportData.length === 0 ? (
            !error && <div className="alert alert-info">Aucune donnée à afficher pour la sélection actuelle.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped table-bordered table-hover mb-0">
                <thead className="table-dark sticky-top">
                  <tr>
                    {/* Cache la colonne Pays si un seul pays est sélectionné */}
                    {selectedCountry === 'all' && <th>Pays</th>}
                    <th>Ville</th>
                    <th>Stock</th>
                    <th>Référence</th>
                    <th>Nom Produit</th>
                    <th className="text-end">Quantité</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Boucle sur les données filtrées */}
                  {filteredReportData.map((paysData, paysIndex) => {
                    let isFirstRowOfPays = true; // Reset pour chaque pays (utile si on affiche tous les pays)
                    return paysData.villes.map((villeData, villeIndex) => {
                      let isFirstRowOfVille = true;
                      const villeKey = `${paysData.pays}-${villeData.ville}`;
                      return villeData.stocks.map((stockData, stockIndex) => {
                        let isFirstRowOfStock = true;
                        const stockKey = `${villeKey}-${stockData.stock.id}`;
                        const stockName = stockData.stock.nom;

                        if (stockData.products.length === 0) {
                          // Afficher une ligne pour les stocks vides
                          const paysCell = selectedCountry === 'all' && isFirstRowOfPays ? <td rowSpan={rowSpans.pays[paysData.pays]} className="align-middle fw-bold">{paysData.pays}</td> : null;
                          const villeCell = isFirstRowOfVille ? <td rowSpan={rowSpans.ville[villeKey]} className="align-middle">{villeData.ville}</td> : null;
                          isFirstRowOfPays = false;
                          isFirstRowOfVille = false;
                          return (
                            <tr key={stockKey + "-empty"}>
                              {paysCell}
                              {villeCell}
                              <td>{stockName}</td>
                              <td colSpan="3" className="text-muted fst-italic">Aucun produit dans ce stock</td>
                            </tr>
                          );
                        }

                        return stockData.products.map((product, productIndex) => {
                          const paysCell = selectedCountry === 'all' && isFirstRowOfPays ? <td rowSpan={rowSpans.pays[paysData.pays]} className="align-middle fw-bold">{paysData.pays}</td> : null;
                          const villeCell = isFirstRowOfVille ? <td rowSpan={rowSpans.ville[villeKey]} className="align-middle">{villeData.ville}</td> : null;
                          const stockCell = isFirstRowOfStock ? <td rowSpan={rowSpans.stock[stockKey]} className="align-middle">{stockName}</td> : null;
                          isFirstRowOfPays = false;
                          isFirstRowOfVille = false;
                          isFirstRowOfStock = false;
                          return (
                            <tr key={`${stockKey}-${product.reference}`}>
                              {paysCell}
                              {villeCell}
                              {stockCell}
                              <td>{product.reference}</td>
                              <td>{product.nom}</td>
                              <td className="text-end fw-bold">{product.quantity}</td>
                            </tr>
                          );
                        });
                      });
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationStockReport;
