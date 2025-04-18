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
import org.slf4j.Logger; // Importer Logger
import org.slf4j.LoggerFactory; // Importer LoggerFactory

import java.util.*; // Importer java.util.*
import java.util.stream.Collectors;

@Service
public class ProduitStockService {

    // Ajouter un logger pour un meilleur suivi
    private static final Logger log = LoggerFactory.getLogger(ProduitStockService.class);

    @Autowired
    private ProduitStockRepository produitStockRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    @Lazy // Garder @Lazy si StockService a une dépendance circulaire potentielle
    private StockRepository stockRepository;

    @Transactional
    public ProduitStock affecterProduitAuStock(Long produitId, Long stockId, int nouvelleQuantite) {
        log.info("Tentative d'affectation - Produit ID: {}, Stock ID: {}, Quantité: {}", produitId, stockId, nouvelleQuantite);

        // Vérifier si l'association existe déjà
        Optional<ProduitStock> existingAssociation = findByStockAndProduit(stockId, produitId);
        if (existingAssociation.isPresent()) {
            log.warn("Affectation échouée: Produit {} déjà affecté au Stock {}", produitId, stockId);
            // Utiliser une exception plus spécifique si possible
            throw new RuntimeException("Ce produit est déjà affecté à ce stock");
        }

        // Vérifier l'existence du produit et du stock
        Produit produit = produitRepository.findById(produitId)
            .orElseThrow(() -> {
                log.error("Produit non trouvé lors de l'affectation: ID {}", produitId);
                // Utiliser une exception plus spécifique (ex: EntityNotFoundException)
                return new RuntimeException("Produit non trouvé: " + produitId);
            });

        Stock stock = stockRepository.findById(stockId)
            .orElseThrow(() -> {
                log.error("Stock non trouvé lors de l'affectation: ID {}", stockId);
                // Utiliser une exception plus spécifique
                return new RuntimeException("Stock non trouvé: " + stockId);
            });

        // Créer la nouvelle association
        ProduitStock newProduitStock = new ProduitStock();
        newProduitStock.setProduit(produit);
        newProduitStock.setStock(stock);
        // Assurer que la quantité n'est pas négative à l'affectation
        newProduitStock.setQuantite(Math.max(nouvelleQuantite, 0));
        // Pas de note ici

        try {
            ProduitStock saved = produitStockRepository.save(newProduitStock);
            log.info("✅ Affectation réussie - Produit ID: {}, Stock ID: {}", produitId, stockId);
            return saved;
        } catch (Exception e) {
            // Loguer l'erreur complète côté serveur
            log.error("❌ Erreur lors de la sauvegarde de l'affectation - Produit ID: {}, Stock ID: {}", produitId, stockId, e);
            // Ne pas exposer les détails internes dans l'exception lancée au client
            throw new RuntimeException("Erreur interne lors de l'affectation du produit au stock.");
        }
    }

    public Optional<ProduitStock> findByStockAndProduit(Long stockId, Long produitId) {
        // Cette méthode est simple et correcte
        return produitStockRepository.findByStock_IdAndProduit_Id(stockId, produitId);
    }

    @Transactional
    public ProduitStock modifierQuantite(Long produitId, Long stockId, int nouvelleQuantite) {
        log.info("Tentative de modification quantité - Produit ID: {}, Stock ID: {}, Nouvelle Quantité: {}", produitId, stockId, nouvelleQuantite);

        try {
            // 1. Récupérer l'association existante
            ProduitStock produitStock = produitStockRepository
                .findByStock_IdAndProduit_Id(stockId, produitId)
                // Utiliser une exception plus spécifique
                .orElseThrow(() -> new RuntimeException("Ce produit n'est pas affecté à ce stock"));

            Integer ancienneQuantite = produitStock.getQuantite(); // Utiliser Integer si le type dans l'entité est Integer

            // 2. Assurer que la nouvelle quantité n'est pas négative
            int quantiteAjustee = Math.max(nouvelleQuantite, 0);

            log.info("Mise à jour quantité: {} -> {}", ancienneQuantite, quantiteAjustee);
            produitStock.setQuantite(quantiteAjustee); // Définit la nouvelle quantité

            // 3. Sauvegarder la modification
            ProduitStock result = produitStockRepository.save(produitStock); // Sauvegarde l'entité modifiée
            log.info("✅ Modification quantité réussie - Produit ID: {}, Stock ID: {}", produitId, stockId);
            return result;

        } catch (RuntimeException e) { // Attraper les exceptions spécifiques d'abord
             log.error("❌ Erreur métier lors de la modification quantité - Produit ID: {}, Stock ID: {}: {}", produitId, stockId, e.getMessage());
             throw e; // Relancer l'exception métier
        } catch (Exception e) {
            log.error("❌ Erreur inattendue lors de la modification quantité - Produit ID: {}, Stock ID: {}", produitId, stockId, e);
            throw new RuntimeException("Erreur interne lors de la modification de la quantité.");
        }
    }

    @Transactional
    public ProduitStock decrementerStock(Long produitId, Long stockId, int quantiteADecrémenter) {
        log.info("Tentative de décrémentation - Produit ID: {}, Stock ID: {}, Quantité à décrémenter: {}", produitId, stockId, quantiteADecrémenter);

        if (quantiteADecrémenter <= 0) {
             log.warn("Tentative de décrémentation avec quantité non positive: {}", quantiteADecrémenter);
             throw new IllegalArgumentException("La quantité à décrémenter doit être positive.");
        }

        try {
            // 1. Récupérer l'association
            ProduitStock produitStock = produitStockRepository
                .findByStock_IdAndProduit_Id(stockId, produitId)
                .orElseThrow(() -> new RuntimeException("Ce produit n'est pas affecté à ce stock"));

            // 2. Vérifier et mettre à jour la quantité
            Integer quantiteActuelle = produitStock.getQuantite();
            if (quantiteActuelle == null) { // Gérer le cas où la quantité pourrait être null
                 quantiteActuelle = 0;
                 log.warn("Quantité nulle trouvée pour Produit ID: {}, Stock ID: {}. Traitée comme 0.", produitId, stockId);
            }


            if (quantiteActuelle < quantiteADecrémenter) {
                log.warn("Stock insuffisant - Produit ID: {}, Stock ID: {}. Demandé: {}, Disponible: {}",
                         produitId, stockId, quantiteADecrémenter, quantiteActuelle);
                throw new RuntimeException("Stock insuffisant. Disponible: " + quantiteActuelle);
            }

            // 3. Calculer et appliquer la nouvelle quantité
            int nouvelleQuantite = quantiteActuelle - quantiteADecrémenter;
            log.info("Mise à jour quantité (décrémentation): {} -> {}", quantiteActuelle, nouvelleQuantite);
            produitStock.setQuantite(nouvelleQuantite);
            // Pas de note ici

            // 4. Sauvegarder la modification
            ProduitStock result = produitStockRepository.save(produitStock);
            log.info("✅ Décrémentation réussie - Produit ID: {}, Stock ID: {}", produitId, stockId);
            return result;

        } catch (RuntimeException e) { // Attraper les exceptions spécifiques d'abord
            log.error("❌ Erreur métier lors de la décrémentation - Produit ID: {}, Stock ID: {}: {}", produitId, stockId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Erreur inattendue lors de la décrémentation - Produit ID: {}, Stock ID: {}", produitId, stockId, e);
            throw new RuntimeException("Erreur interne lors de la décrémentation.");
        }
    }

    @Transactional
    public void annulerAffectation(Long produitId, Long stockId) {
        log.info("Tentative d'annulation affectation - Produit ID: {}, Stock ID: {}", produitId, stockId);

        try {
            // Trouver l'entité d'abord pour s'assurer qu'elle existe
            ProduitStock produitStock = produitStockRepository
                .findByStock_IdAndProduit_Id(stockId, produitId)
                .orElseThrow(() -> new RuntimeException("Ce produit n'est pas affecté à ce stock"));

            // Supprimer l'association trouvée
            produitStockRepository.delete(produitStock);
            log.info("✅ Affectation annulée avec succès - Produit ID: {}, Stock ID: {}", produitId, stockId);

        } catch (RuntimeException e) { // Attraper les exceptions spécifiques d'abord
             log.error("❌ Erreur métier lors de l'annulation - Produit ID: {}, Stock ID: {}: {}", produitId, stockId, e.getMessage());
             throw e;
        } catch (Exception e) {
            log.error("❌ Erreur inattendue lors de l'annulation - Produit ID: {}, Stock ID: {}", produitId, stockId, e);
            throw new RuntimeException("Erreur interne lors de l'annulation de l'affectation.");
        }
    }

    // Utiliser @Transactional(readOnly = true) pour les opérations de lecture
    @Transactional(readOnly = true)
    public List<ProduitStock> getProduitsByStock(Long stockId) {
        log.debug("Récupération des produits pour Stock ID: {}", stockId);
        // Attention: Cette méthode peut causer le problème N+1 si Produit est LAZY.
        // Envisager une requête JOIN FETCH dans le repository si les performances sont un problème.
        // Exemple dans ProduitStockRepository:
        // @Query("SELECT ps FROM ProduitStock ps JOIN FETCH ps.produit p WHERE ps.stock.id = :stockId")
        // List<ProduitStock> findByStockIdWithProduit(@Param("stockId") Long stockId);

        // Retourne directement la liste des entités ProduitStock
        return produitStockRepository.findByStock_Id(stockId);
    }

    /**
     * Génère un rapport des produits par pays avec des statistiques
     * @return Une map contenant les statistiques par pays
     */
    @Transactional(readOnly = true) // Opération de lecture
    public Map<String, Object> genererRapportParPays() {
        log.info("Génération du rapport par pays...");
        // Récupérer tous les stocks (peut être optimisé si beaucoup de stocks)
        List<Stock> stocks = stockRepository.findAll();

        // Grouper les stocks par pays
        Map<String, List<Stock>> stocksByCountry = stocks.stream()
                .collect(Collectors.groupingBy(
                    stock -> {
                        String pays = stock.getPays();
                        // Gérer les cas null/vide de manière plus concise
                        return (pays != null && !pays.trim().isEmpty()) ? pays.trim() : "Non défini";
                    }
                ));

        Map<String, Object> rapport = new HashMap<>();
        Map<String, Map<String, Object>> statsByCountry = new HashMap<>();
        long totalProduitsGlobal = 0; // Utiliser long pour éviter dépassement
        long totalQuantiteGlobal = 0; // Utiliser long

        // Pour chaque pays, calculer les statistiques
        for (Map.Entry<String, List<Stock>> entry : stocksByCountry.entrySet()) {
            String pays = entry.getKey();
            List<Stock> stocksDuPays = entry.getValue();
            log.debug("Traitement du pays: {} ({} stocks)", pays, stocksDuPays.size());

            Map<String, Object> countryStats = new HashMap<>();
            countryStats.put("nombreStocks", stocksDuPays.size());

            // Liste des villes uniques dans ce pays
            List<String> villesUniques = stocksDuPays.stream()
                    .map(Stock::getVille)
                    .filter(Objects::nonNull) // Filtrer les villes nulles
                    .map(String::trim)         // Enlever les espaces
                    .filter(ville -> !ville.isEmpty()) // Filtrer les villes vides
                    .distinct()
                    .sorted(String.CASE_INSENSITIVE_ORDER) // Trier sans tenir compte de la casse
                    .collect(Collectors.toList());
            countryStats.put("villes", villesUniques);
            countryStats.put("nombreVilles", villesUniques.size());

            // Compter les produits et les quantités totales par pays
            long totalProduitsPays = 0; // Utiliser long
            long totalQuantitePays = 0; // Utiliser long
            Map<String, Long> quantiteParType = new HashMap<>(); // Utiliser Long pour les quantités

            for (Stock stock : stocksDuPays) {
                // Attention: Appels multiples au repository dans une boucle (problème N+1 potentiel)
                // Il serait préférable de récupérer tous les ProduitStock en une fois si possible
                List<ProduitStock> produitsEnStock = produitStockRepository.findByStock(stock); // Ou findByStock_Id

                totalProduitsPays += produitsEnStock.size();

                for (ProduitStock ps : produitsEnStock) {
                    Integer quantite = ps.getQuantite();
                    if (quantite != null) { // Vérifier si la quantité est nulle
                        totalQuantitePays += quantite;

                        // Compter par type de stock (vérifier si typeStock peut être null)
                        if (stock.getTypeStock() != null) {
                            String typeStock = stock.getTypeStock().name();
                            quantiteParType.put(typeStock, quantiteParType.getOrDefault(typeStock, 0L) + quantite);
                        }
                    } else {
                         log.warn("Quantité nulle trouvée pour ProduitStock ID: {}", ps.getId());
                    }
                }
            }

            countryStats.put("totalProduits", totalProduitsPays); // Nombre d'associations produit-stock
            countryStats.put("totalQuantite", totalQuantitePays);
            countryStats.put("quantiteParType", quantiteParType);

            statsByCountry.put(pays, countryStats);
            totalProduitsGlobal += totalProduitsPays;
            totalQuantiteGlobal += totalQuantitePays;
        }

        rapport.put("statsByCountry", statsByCountry);

        // Ajouter les totaux globaux (calculés pendant la boucle pour éviter requêtes supplémentaires)
        Map<String, Object> globalStats = new HashMap<>();
        globalStats.put("totalStocks", stocks.size());
        globalStats.put("totalProduits", totalProduitsGlobal); // Total des associations
        globalStats.put("totalQuantite", totalQuantiteGlobal);
        globalStats.put("nombrePays", stocksByCountry.size());

        rapport.put("globalStats", globalStats);
        log.info("Rapport par pays généré avec succès.");
        return rapport;
    }

    /**
     * Récupère les produits dont la quantité est inférieure au seuil spécifié
     * @param seuil Le seuil minimal de quantité
     * @return Une map contenant les produits à stock faible groupés par pays
     */
    @Transactional(readOnly = true) // Opération de lecture
    public Map<String, Object> getProduitsBelowThreshold(int seuil) {
        log.info("Recherche des produits avec quantité < {}", seuil);
        // Attention: Récupérer TOUS les ProduitStock peut être très coûteux en mémoire.
        // Envisager une requête spécifique dans le repository:
        // @Query("SELECT ps FROM ProduitStock ps JOIN FETCH ps.produit JOIN FETCH ps.stock WHERE ps.quantite < :seuil")
        // List<ProduitStock> findBelowThresholdWithDetails(@Param("seuil") int seuil);
        List<ProduitStock> produitsBelowThreshold = produitStockRepository.findAll().stream()
                .filter(ps -> ps.getQuantite() != null && ps.getQuantite() < seuil) // Vérifier null et < seuil
                .collect(Collectors.toList());

        // Grouper les produits par pays
        Map<String, List<Map<String, Object>>> produitsByCountry = new HashMap<>();

        for (ProduitStock ps : produitsBelowThreshold) {
            // Accéder aux entités liées (peut causer N+1 si non chargées par la requête initiale)
            Stock stock = ps.getStock();
            Produit produit = ps.getProduit();

            // Vérifier si les entités liées sont nulles (si les relations sont optionnelles ou s'il y a un problème de données)
            if (stock == null || produit == null) {
                 log.warn("Données Produit ou Stock manquantes pour ProduitStock ID: {}", ps.getId());
                 continue; // Ignorer cette entrée
            }


            String pays = stock.getPays();
            if (pays == null || pays.trim().isEmpty()) {
                pays = "Non défini";
            }

            // Utiliser computeIfAbsent pour simplifier l'ajout à la map
            produitsByCountry.computeIfAbsent(pays, k -> new ArrayList<>());

            Map<String, Object> produitInfo = new HashMap<>();
            produitInfo.put("produitStockId", ps.getId()); // ID de l'association
            produitInfo.put("id", produit.getId());
            produitInfo.put("nom", produit.getNom());
            produitInfo.put("reference", produit.getReference());
            produitInfo.put("stockId", stock.getId());
            produitInfo.put("stockNom", stock.getNom());
            produitInfo.put("ville", stock.getVille());
            produitInfo.put("typeStock", stock.getTypeStock() != null ? stock.getTypeStock().name() : "N/A");
            produitInfo.put("quantite", ps.getQuantite());
            // Pas de note ici
            produitInfo.put("seuil", seuil);
            // Calculer le manquant (gérer null pour quantité)
            produitInfo.put("manquant", Math.max(0, seuil - (ps.getQuantite() != null ? ps.getQuantite() : 0)));

            produitsByCountry.get(pays).add(produitInfo);
        }

        Map<String, Object> rapport = new HashMap<>();
        rapport.put("seuil", seuil);
        rapport.put("totalProduits", produitsBelowThreshold.size());
        rapport.put("produitsByCountry", produitsByCountry);

        // Ajouter les totaux par pays
        Map<String, Integer> totalsByCountry = new HashMap<>(); // Utiliser Integer pour le compte
        for (Map.Entry<String, List<Map<String, Object>>> entry : produitsByCountry.entrySet()) {
            totalsByCountry.put(entry.getKey(), entry.getValue().size());
        }
        rapport.put("totalsByCountry", totalsByCountry);

        log.info("Rapport stock faible généré: {} produits trouvés.", produitsBelowThreshold.size());
        return rapport;
    }

    /**
     * Get stock statistics including product counts and status
     * @return Map containing statistics for each stock
     */
    @Transactional(readOnly = true) // Opération de lecture
    public Map<String, Object> getStockStatistics() {
        log.info("Calcul des statistiques de stock...");
        Map<String, Object> result = new HashMap<>();
        List<Stock> allStocks = stockRepository.findAll(); // Attention N+1 potentiel si accès aux relations de Stock plus tard

        final int LOW_STOCK_THRESHOLD = 30; // Utiliser une constante pour le seuil

        for (Stock stock : allStocks) {
            // Attention: N+1 potentiel ici. Envisager une requête optimisée.
            List<ProduitStock> produitStocks = produitStockRepository.findByStock(stock); // Ou findByStock_Id
            Map<String, Object> stockStats = new HashMap<>();

            int totalProducts = produitStocks.size();
            int lowStockCount = 0;
            int zeroStockCount = 0;

            for (ProduitStock ps : produitStocks) {
                Integer quantite = ps.getQuantite(); // Utiliser Integer
                // int seuilAlerte = ps.getProduit().getSeuilAlerte(); // Attention N+1 si Produit est LAZY

                if (quantite == null || quantite <= 0) { // Gérer null et zéro
                    zeroStockCount++;
                } else if (quantite <= LOW_STOCK_THRESHOLD) { // Utiliser la constante
                    lowStockCount++;
                }
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalProducts", totalProducts);
            stats.put("lowStockCount", lowStockCount);
            stats.put("zeroStockCount", zeroStockCount);
            // Calcul correct pour normalStockCount
            stats.put("normalStockCount", totalProducts - lowStockCount - zeroStockCount);
            stats.put("stockStatus", calculateStockStatus(totalProducts, lowStockCount, zeroStockCount));

            // Add product details (Attention N+1 potentiel si Produit est LAZY)
            List<Map<String, Object>> productDetails = produitStocks.stream()
                .filter(ps -> ps.getProduit() != null) // Vérifier que Produit n'est pas null
                .map(ps -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("produitStockId", ps.getId()); // ID de l'association
                    detail.put("id", ps.getProduit().getId());
                    detail.put("nom", ps.getProduit().getNom());
                    detail.put("reference", ps.getProduit().getReference());
                    detail.put("quantite", ps.getQuantite());
                    // Pas de note ici
                    // detail.put("seuilAlerte", ps.getProduit().getSeuilAlerte()); // Décommenter si seuilAlerte existe et est chargé
                    detail.put("status", getProductStatus(ps.getQuantite() != null ? ps.getQuantite() : 0, LOW_STOCK_THRESHOLD)); // Gérer null et utiliser constante
                    return detail;
                })
                .collect(Collectors.toList());

            stats.put("products", productDetails);
            // Utiliser l'ID comme clé est plus fiable que le nom
            result.put(stock.getId().toString(), stats);
        }
        log.info("Statistiques de stock calculées pour {} stocks.", allStocks.size());
        return result;
    }

    // Méthodes utilitaires privées
    private String calculateStockStatus(int total, int low, int zero) {
        // Utiliser des constantes pour les statuts
        final String STATUS_EMPTY = "EMPTY";
        final String STATUS_CRITICAL = "CRITICAL";
        final String STATUS_WARNING = "WARNING";
        final String STATUS_NORMAL = "NORMAL";

        if (total == 0) return STATUS_EMPTY;
        if (zero > 0) return STATUS_CRITICAL; // Au moins un produit à zéro
        if (low > 0) return STATUS_WARNING; // Au moins un produit en stock faible (mais aucun à zéro)
        return STATUS_NORMAL; // Tous les produits ont une quantité normale
    }

    private String getProductStatus(int quantite, int seuil) {
         // Utiliser des constantes pour les statuts
        final String STATUS_ZERO = "ZERO_STOCK";
        final String STATUS_LOW = "LOW_STOCK";
        final String STATUS_NORMAL = "NORMAL";

        if (quantite <= 0) return STATUS_ZERO; // Inclure 0 ici
        if (quantite <= seuil) return STATUS_LOW;
        return STATUS_NORMAL;
    }
}
