package com.ecomub.stocks.service;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.repository.ProduitRepository;
import com.ecomub.stocks.repository.ProduitStockRepository;
import com.ecomub.stocks.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
public class ProduitStockService {

    @Autowired
    private ProduitStockRepository produitStockRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    @Lazy
    private StockRepository stockRepository;

    @Transactional
    public ProduitStock affecterProduitAuStock(Long produitId, Long stockId, int nouvelleQuantite) {
        System.out.println("\n=== AFFECTATION PRODUIT AU STOCK ===");
        System.out.println("Produit ID: " + produitId);
        System.out.println("Stock ID: " + stockId);
        System.out.println("Quantité initiale: " + nouvelleQuantite);

        // Vérifier si l'association existe déjà
        Optional<ProduitStock> existingAssociation = findByStockAndProduit(stockId, produitId);
        if (existingAssociation.isPresent()) {
            throw new RuntimeException("Ce produit est déjà affecté à ce stock");
        }

        // Vérifier l'existence du produit et du stock
        Produit produit = produitRepository.findById(produitId)
            .orElseThrow(() -> new RuntimeException("Produit non trouvé: " + produitId));
        
        Stock stock = stockRepository.findById(stockId)
            .orElseThrow(() -> new RuntimeException("Stock non trouvé: " + stockId));

        // Créer la nouvelle association
        ProduitStock newProduitStock = new ProduitStock();
        newProduitStock.setProduit(produit);
        newProduitStock.setStock(stock);
        newProduitStock.setQuantite(nouvelleQuantite);

        try {
            ProduitStock saved = produitStockRepository.save(newProduitStock);
            System.out.println("✅ Affectation réussie");
            return saved;
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de l'affectation: " + e.getMessage());
            throw new RuntimeException("Erreur lors de l'affectation du produit au stock");
        }
    }

    public Optional<ProduitStock> findByStockAndProduit(Long stockId, Long produitId) {
        return produitStockRepository.findByStock_IdAndProduit_Id(stockId, produitId);
    }

    @Transactional
    public ProduitStock modifierQuantite(Long produitId, Long stockId, int nouvelleQuantite) {
        System.out.println("\n=== MODIFICATION STOCK ===");
        System.out.println("Produit ID: " + produitId);
        System.out.println("Stock ID: " + stockId);
        System.out.println("Nouvelle quantité demandée: " + nouvelleQuantite);

        try {
            // 1. Vérifier l'existence de l'association
            Optional<ProduitStock> produitStockOpt = produitStockRepository
                .findByStock_IdAndProduit_Id(stockId, produitId);

            if (produitStockOpt.isEmpty()) {
                throw new RuntimeException("Ce produit n'est pas affecté à ce stock");
            }

            // 2. Mettre à jour la quantité
            ProduitStock produitStock = produitStockOpt.get();
            int ancienneQuantite = produitStock.getQuantite();
            
            // 3. Assurer que la quantité n'est pas négative
            if (nouvelleQuantite < 0) {
                nouvelleQuantite = 0;
            }

            System.out.println("Mise à jour: " + ancienneQuantite + " -> " + nouvelleQuantite);
            produitStock.setQuantite(nouvelleQuantite);
            
            // 4. Sauvegarder la modification
            ProduitStock result = produitStockRepository.save(produitStock);
            System.out.println("✅ Modification effectuée avec succès");
            return result;

        } catch (Exception e) {
            System.out.println("❌ Erreur: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    @Transactional
    public ProduitStock decrementerStock(Long produitId, Long stockId, int quantiteADecrémenter) {
        System.out.println("\n=== DÉCRÉMENTATION STOCK ===");
        System.out.println("Produit ID: " + produitId);
        System.out.println("Stock ID: " + stockId);
        System.out.println("Quantité à décrémenter: " + quantiteADecrémenter);

        try {
            // 1. Vérifier l'existence de l'association
            Optional<ProduitStock> produitStockOpt = produitStockRepository
                .findByStock_IdAndProduit_Id(stockId, produitId);

            if (produitStockOpt.isEmpty()) {
                throw new RuntimeException("Ce produit n'est pas affecté à ce stock");
            }

            // 2. Vérifier et mettre à jour la quantité
            ProduitStock produitStock = produitStockOpt.get();
            int quantiteActuelle = produitStock.getQuantite();

            if (quantiteActuelle < quantiteADecrémenter) {
                throw new RuntimeException("Stock insuffisant. Disponible: " + quantiteActuelle);
            }

            // 3. Calculer et appliquer la nouvelle quantité
            int nouvelleQuantite = quantiteActuelle - quantiteADecrémenter;
            System.out.println("Mise à jour: " + quantiteActuelle + " -> " + nouvelleQuantite);
            produitStock.setQuantite(nouvelleQuantite);
            
            // 4. Sauvegarder la modification
            ProduitStock result = produitStockRepository.save(produitStock);
            System.out.println("✅ Décrémentation effectuée avec succès");
            return result;

        } catch (Exception e) {
            System.out.println("❌ Erreur: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    public List<ProduitStock> getProduitsByStock(Long stockId) {
        // Utiliser la méthode correcte pour récupérer tous les produits d'un stock
        return produitStockRepository.findByStock_Id(stockId);
    }

    /**
     * Génère un rapport des produits par pays avec des statistiques
     * @return Une map contenant les statistiques par pays
     */
    public Map<String, Object> genererRapportParPays() {
        // Récupérer tous les stocks
        List<Stock> stocks = stockRepository.findAll();
        
        // Grouper les stocks par pays
        Map<String, List<Stock>> stocksByCountry = stocks.stream()
                .collect(Collectors.groupingBy(
                    stock -> {
                        String pays = stock.getPays();
                        return (pays != null && !pays.isEmpty()) ? pays : "Non défini";
                    }
                ));
        
        // Initialiser le rapport
        Map<String, Object> rapport = new HashMap<>();
        Map<String, Map<String, Object>> statsByCountry = new HashMap<>();
        
        // Pour chaque pays, calculer les statistiques
        for (Map.Entry<String, List<Stock>> entry : stocksByCountry.entrySet()) {
            String pays = entry.getKey();
            List<Stock> stocksDuPays = entry.getValue();
            
            // Initialiser les statistiques pour ce pays
            Map<String, Object> countryStats = new HashMap<>();
            countryStats.put("nombreStocks", stocksDuPays.size());
            
            // Liste des villes uniques dans ce pays
            List<String> villesUniques = stocksDuPays.stream()
                    .map(Stock::getVille)
                    .distinct()
                    .collect(Collectors.toList());
            countryStats.put("villes", villesUniques);
            countryStats.put("nombreVilles", villesUniques.size());
            
            // Compter les produits et les quantités totales par pays
            int totalProduits = 0;
            int totalQuantite = 0;
            Map<String, Integer> produitParType = new HashMap<>();
            
            for (Stock stock : stocksDuPays) {
                List<ProduitStock> produitsEnStock = produitStockRepository.findByStock(stock);
                
                totalProduits += produitsEnStock.size();
                
                for (ProduitStock ps : produitsEnStock) {
                    totalQuantite += ps.getQuantite();
                    
                    // Compter par type de stock
                    String typeStock = stock.getTypeStock().name();
                    produitParType.put(typeStock, produitParType.getOrDefault(typeStock, 0) + ps.getQuantite());
                }
            }
            
            countryStats.put("totalProduits", totalProduits);
            countryStats.put("totalQuantite", totalQuantite);
            countryStats.put("quantiteParType", produitParType);
            
            // Ajouter au rapport global
            statsByCountry.put(pays, countryStats);
        }
        
        // Ajouter les statistiques au rapport
        rapport.put("statsByCountry", statsByCountry);
        
        // Ajouter les totaux globaux
        int totalStocksGlobal = stocks.size();
        int totalProduitsGlobal = produitStockRepository.findAll().size();
        int totalQuantiteGlobal = produitStockRepository.findAll().stream()
                .mapToInt(ProduitStock::getQuantite)
                .sum();
        
        Map<String, Object> globalStats = new HashMap<>();
        globalStats.put("totalStocks", totalStocksGlobal);
        globalStats.put("totalProduits", totalProduitsGlobal);
        globalStats.put("totalQuantite", totalQuantiteGlobal);
        globalStats.put("nombrePays", stocksByCountry.size());
        
        rapport.put("globalStats", globalStats);
        
        return rapport;
    }
    
    /**
     * Récupère les produits dont la quantité est inférieure au seuil spécifié
     * @param seuil Le seuil minimal de quantité
     * @return Une map contenant les produits à stock faible groupés par pays
     */
    public Map<String, Object> getProduitsBelowThreshold(int seuil) {
        // Récupérer tous les produits en stock avec une quantité inférieure au seuil
        List<ProduitStock> produitsBelowThreshold = produitStockRepository.findAll().stream()
                .filter(ps -> ps.getQuantite() < seuil)
                .collect(Collectors.toList());
        
        // Grouper les produits par pays
        Map<String, List<Map<String, Object>>> produitsByCountry = new HashMap<>();
        
        for (ProduitStock ps : produitsBelowThreshold) {
            Stock stock = ps.getStock();
            Produit produit = ps.getProduit();
            
            String pays = stock.getPays();
            if (pays == null || pays.isEmpty()) {
                pays = "Non défini";
            }
            
            if (!produitsByCountry.containsKey(pays)) {
                produitsByCountry.put(pays, new ArrayList<>());
            }
            
            Map<String, Object> produitInfo = new HashMap<>();
            produitInfo.put("id", produit.getId());
            produitInfo.put("nom", produit.getNom());
            produitInfo.put("reference", produit.getReference());
            produitInfo.put("stockId", stock.getId());
            produitInfo.put("stockNom", stock.getNom());
            produitInfo.put("ville", stock.getVille());
            produitInfo.put("typeStock", stock.getTypeStock().name());
            produitInfo.put("quantite", ps.getQuantite());
            produitInfo.put("seuil", seuil);
            produitInfo.put("manquant", seuil - ps.getQuantite());
            
            produitsByCountry.get(pays).add(produitInfo);
        }
        
        // Créer le rapport final
        Map<String, Object> rapport = new HashMap<>();
        rapport.put("seuil", seuil);
        rapport.put("totalProduits", produitsBelowThreshold.size());
        rapport.put("produitsByCountry", produitsByCountry);
        
        // Ajouter les totaux par pays
        Map<String, Object> totalsByCountry = new HashMap<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : produitsByCountry.entrySet()) {
            totalsByCountry.put(entry.getKey(), entry.getValue().size());
        }
        rapport.put("totalsByCountry", totalsByCountry);
        
        return rapport;
    }

    /**
     * Get stock statistics including product counts and status
     * @return Map containing statistics for each stock
     */
    public Map<String, Object> getStockStatistics() {
        Map<String, Object> result = new HashMap<>();
        List<Stock> allStocks = stockRepository.findAll();

        for (Stock stock : allStocks) {
            List<ProduitStock> produitStocks = produitStockRepository.findByStock(stock);
            Map<String, Object> stockStats = new HashMap<>();

            // Initialize counters
            int totalProducts = produitStocks.size();
            int lowStockCount = 0;
            int zeroStockCount = 0;

            // Calculate statistics
            for (ProduitStock ps : produitStocks) {
                int quantite = ps.getQuantite();
                int seuilAlerte = ps.getProduit().getSeuilAlerte();

                if (quantite == 0) {
                    zeroStockCount++;
                } else if (quantite <= seuilAlerte) {
                    lowStockCount++;
                }
            }

            // Build stock statistics
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalProducts", totalProducts);
            stats.put("lowStockCount", lowStockCount);
            stats.put("zeroStockCount", zeroStockCount);
            stats.put("normalStockCount", totalProducts - (lowStockCount + zeroStockCount));
            stats.put("stockStatus", calculateStockStatus(totalProducts, lowStockCount, zeroStockCount));
            
            // Add product details
            List<Map<String, Object>> productDetails = produitStocks.stream()
                .map(ps -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("id", ps.getProduit().getId());
                    detail.put("nom", ps.getProduit().getNom());
                    detail.put("reference", ps.getProduit().getReference());
                    detail.put("quantite", ps.getQuantite());
                    detail.put("seuilAlerte", ps.getProduit().getSeuilAlerte());
                    detail.put("status", getProductStatus(ps.getQuantite(), ps.getProduit().getSeuilAlerte()));
                    return detail;
                })
                .collect(Collectors.toList());
            
            stats.put("products", productDetails);
            result.put(stock.getId().toString(), stats);
        }

        return result;
    }

    private String calculateStockStatus(int total, int low, int zero) {
        if (total == 0) return "EMPTY";
        if (zero > 0) return "CRITICAL";
        if (low > 0) return "WARNING";
        return "NORMAL";
    }

    private String getProductStatus(int quantite, int seuil) {
        if (quantite == 0) return "ZERO_STOCK";
        if (quantite <= seuil) return "LOW_STOCK";
        return "NORMAL";
    }
}

