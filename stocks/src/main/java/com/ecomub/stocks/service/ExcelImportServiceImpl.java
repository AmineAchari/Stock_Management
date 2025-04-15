package com.ecomub.stocks.service;

import com.ecomub.stocks.model.*;
import com.ecomub.stocks.repository.ProduitRepository;
import com.ecomub.stocks.repository.ProduitStockRepository;
import com.ecomub.stocks.repository.StockRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExcelImportServiceImpl implements ExcelImportService {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private ProduitStockRepository produitStockRepository;

    @Autowired
    private ProduitService produitService;

    @Autowired
    private ProduitStockService produitStockService;

    @Autowired
    private MappingLivreurService mappingLivreurService;

    @Override
    @Transactional
    public Map<String, Object> importLivraisonData(MultipartFile file, String paysSpecifie, String villeSpecifiee, String dateSpecifiee) throws Exception {
        try {
            // Résultats de l'importation
            Map<String, Object> resultat = new HashMap<>();
            Map<String, List<Map<String, Object>>> resultatsParPays = new HashMap<>();

            // Statistiques globales
            int totalLivraisons = 0;
            int totalProduits = 0;
            Set<String> livreursUniques = new HashSet<>();

            // Lecture du fichier Excel
            Workbook workbook = WorkbookFactory.create(file.getInputStream());
            Sheet sheet = workbook.getSheetAt(0);

            // Traiter les données ligne par ligne
            boolean headerFound = false;
            int[] columns = new int[4]; // {livreur, produit, quantite, date}
            Arrays.fill(columns, -1);

            for (Row row : sheet) {
                // Traitement des en-têtes
                if (!headerFound) {
                    headerFound = processHeaders(row, columns);
                    if (!headerFound) {
                        throw new Exception("En-têtes requises non trouvées dans le fichier");
                    }
                    continue;
                }

                // Use column indices safely
                if (row.getCell(columns[0]) == null || row.getCell(columns[1]) == null || 
                    row.getCell(columns[2]) == null) {
                    continue; // Skip rows with missing required cells
                }

                String nomLivreur = getCellValueAsString(row.getCell(columns[0])).trim();
                String nomProduit = getCellValueAsString(row.getCell(columns[1])).trim();
                String quantiteStr = getCellValueAsString(row.getCell(columns[2])).trim();

                // Validation de base
                if (!validateBasicData(nomLivreur, nomProduit, quantiteStr)) {
                    continue;
                }

                // Vérifier la date si spécifiée
                if (dateSpecifiee != null && !dateSpecifiee.isEmpty() && columns[3] >= 0) {
                    if (!validateDate(row.getCell(columns[3]), dateSpecifiee)) {
                        continue;
                    }
                }

                // Convertir et valider la quantité
                int quantite = parseQuantite(quantiteStr);
                if (quantite <= 0) {
                    continue;
                }

                // Traiter le mapping et le stock
                MappingLivreur mapping = findMatchingLivreurMapping(nomLivreur);
                if (mapping == null) {
                    addToNonMappedResults(resultatsParPays, nomLivreur, nomProduit, quantite);
                    continue;
                }

                // Vérifier les filtres de ville
                if (!validateVille(mapping.getVille(), villeSpecifiee)) {
                    continue;
                }

                // Trouver et vérifier le produit
                Produit produit = findProduitByName(nomProduit);
                if (produit == null) {
                    addToNonMappedResults(resultatsParPays, nomLivreur, nomProduit, quantite);
                    continue;
                }

                // Trouver et vérifier le stock
                Stock stock = findUniqueStock(mapping);
                if (stock == null) {
                    addToUnmatchedResults(resultatsParPays, mapping, nomProduit, quantite);
                    continue;
                }

                // Mise à jour du stock
                boolean stockUpdated = decrementStock(stock, produit, quantite);
                String pays = determinerPays(stock, paysSpecifie);

                // Vérifier le filtre de pays
                if (!validatePays(pays, paysSpecifie)) {
                    continue;
                }

                // Ajouter aux résultats
                addToResults(resultatsParPays, pays, mapping.getVille(), mapping.getTypeStock(), 
                    nomLivreur, produit, quantite, stockUpdated);

                // Mettre à jour les compteurs
                if (stockUpdated) {
                    totalLivraisons++;
                    totalProduits += quantite;
                    livreursUniques.add(nomLivreur);
                }
            }

            // Finaliser les résultats
            completeResults(resultat, resultatsParPays, totalLivraisons, totalProduits, livreursUniques);
            workbook.close();
            return resultat;

        } catch (Exception e) {
            throw new Exception("Erreur lors de l'importation: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> importProduitsData(MultipartFile file) throws Exception {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> importedProducts = new ArrayList<>();
        int totalSuccess = 0;
        int totalSkipped = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            
            // Find headers
            Row headerRow = sheet.getRow(0);
            int nomCol = -1;
            int refCol = -1;
            
            for (Cell cell : headerRow) {
                String header = cell.getStringCellValue().trim().toLowerCase();
                if (header.contains("produit")) nomCol = cell.getColumnIndex();
                if (header.contains("ref")) refCol = cell.getColumnIndex();
            }

            if (nomCol == -1 || refCol == -1) {
                throw new Exception("Format de fichier invalide: colonnes Produit et Ref requises");
            }

            // Process rows
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String nom = getCellValueAsString(row.getCell(nomCol)).trim();
                String ref = getCellValueAsString(row.getCell(refCol)).trim();

                if (nom.isEmpty() || ref.isEmpty()) {
                    totalSkipped++;
                    continue;
                }

                try {
                    // Check if product already exists
                    if (produitRepository.findProduitByNom(nom) != null) {
                        Map<String, Object> skipped = new HashMap<>();
                        skipped.put("nom", nom);
                        skipped.put("reference", ref);
                        skipped.put("status", "Ignoré - Produit existant");
                        importedProducts.add(skipped);
                        totalSkipped++;
                        continue;
                    }

                    // Create new product
                    Produit produit = new Produit();
                    produit.setNom(nom);
                    produit.setReference(Integer.parseInt(ref));
                    produitRepository.save(produit);

                    Map<String, Object> imported = new HashMap<>();
                    imported.put("nom", nom);
                    imported.put("reference", ref);
                    imported.put("status", "Importé avec succès");
                    importedProducts.add(imported);
                    totalSuccess++;

                } catch (Exception e) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("nom", nom);
                    error.put("reference", ref);
                    error.put("status", "Erreur: " + e.getMessage());
                    importedProducts.add(error);
                    totalSkipped++;
                }
            }
        }

        result.put("produits", importedProducts);
        result.put("totalImportes", totalSuccess);
        result.put("totalIgnores", totalSkipped);
        
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> importStocksData(MultipartFile file) throws Exception {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> importedStocks = new ArrayList<>();
        int totalSuccess = 0;
        int totalSkipped = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            
            Row headerRow = sheet.getRow(0);
            int[] columns = findColumns(headerRow);
            
            if (!validateColumns(columns)) {
                throw new Exception("Format de fichier invalide: colonnes Prestataire et Ville requises");
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String nom = getCellValueAsString(row.getCell(columns[0])).trim();
                String ville = getCellValueAsString(row.getCell(columns[1])).trim();

                if (nom.isEmpty() || ville.isEmpty()) {
                    totalSkipped++;
                    continue;
                }

                try {
                    if (stockRepository.findByNom(nom).isPresent()) {
                        Map<String, Object> skipped = new HashMap<>();
                        skipped.put("nom", nom);
                        skipped.put("ville", ville);
                        skipped.put("status", "Ignoré - Stock existant");
                        importedStocks.add(skipped);
                        totalSkipped++;
                        continue;
                    }

                    Stock stock = new Stock();
                    stock.setNom(nom);
                    stock.setVille(ville);
                    stock.setPays("Cameroun"); // Pays par défaut
                    stock.setTypeStock(TypeStock.PRESTATAIRE);

                    stock = stockRepository.save(stock);

                    Map<String, Object> imported = new HashMap<>();
                    imported.put("nom", nom);
                    imported.put("ville", ville);
                    imported.put("pays", stock.getPays());
                    imported.put("typeStock", stock.getTypeStock().name());
                    imported.put("status", "Importé avec succès");
                    importedStocks.add(imported);
                    totalSuccess++;

                } catch (Exception e) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("nom", nom);
                    error.put("ville", ville);
                    error.put("status", "Erreur: " + e.getMessage());
                    importedStocks.add(error);
                    totalSkipped++;
                }
            }
        }

        result.put("stocks", importedStocks);
        result.put("totalImportes", totalSuccess);
        result.put("totalIgnores", totalSkipped);
        
        return result;
    }

    private int[] findColumns(Row headerRow) {
        int[] columns = new int[2]; // Modifié pour {nom, ville} uniquement
        Arrays.fill(columns, -1);

        
        for (Cell cell : headerRow) {
            String header = getCellValueAsString(cell).trim().toLowerCase();
            int columnIndex = cell.getColumnIndex();
            
            if (header.contains("prestataire")) columns[0] = columnIndex;
            else if (header.contains("ville")) columns[1] = columnIndex;
        }
        
        return columns;
    }

    private boolean validateColumns(int[] columns) {
        // Vérifier uniquement les colonnes Prestataire et Ville
        return columns[0] >= 0 && columns[1] >= 0;
    }

    /**
     * Trouve un mapping de livreur correspondant à un nom de livreur
     * Utilise une recherche approximative pour tolérer les variations dans le nom
     */
    private MappingLivreur findMatchingLivreurMapping(String nomLivreur) {
        System.out.println("=== RECHERCHE MAPPING LIVREUR ===");
        System.out.println("Nom livreur recherché: " + nomLivreur);

        List<MappingLivreur> allMappings = mappingLivreurService.getAllMappings();
        System.out.println("Nombre total de mappings: " + allMappings.size());

        // Check for exact match first
        MappingLivreur exactMatch = allMappings.stream()
            .filter(m -> m.getNomLivreur().equalsIgnoreCase(nomLivreur))
            .peek(m -> System.out.println("Vérification mapping: " + m.getNomLivreur() +
                " -> " + m.getVille() + " (" + m.getTypeStock() + ")"))
            .findFirst()
            .orElse(null);

        if (exactMatch != null) {
            System.out.println("SUCCESS: Mapping exact trouvé!");
            System.out.println("Stock associé: " + exactMatch.getVille() +
                " (" + exactMatch.getTypeStock() + ")");
            return exactMatch;
        }

        System.out.println("Aucun mapping exact trouvé, recherche partielle...");
        return null;
    }

    /**
     * Ajoute une entrée aux résultats pour les produits sans mapping
     */
    private void addToNonMappedResults(Map<String, List<Map<String, Object>>> resultatsParPays,
                                 String nomLivreur, String nomProduit, int quantite) {
        String pays = "Non mappé";

        if (!resultatsParPays.containsKey(pays)) {
            resultatsParPays.put(pays, new ArrayList<>());
        }

        Map<String, Object> entree = new HashMap<>();
        entree.put("livreur", nomLivreur);
        entree.put("produit", nomProduit);
        entree.put("quantite", quantite);
        entree.put("statut", "Non mappé");

        resultatsParPays.get(pays).add(entree);
    }

    /**
     * Ajoute une entrée aux résultats pour les produits sans stock correspondant
     */
    private void addToUnmatchedResults(Map<String, List<Map<String, Object>>> resultatsParPays,
                                 MappingLivreur mapping, String nomProduit, int quantite) {
        String pays = "Stock non trouvé";

        if (!resultatsParPays.containsKey(pays)) {
            resultatsParPays.put(pays, new ArrayList<>());
        }

        Map<String, Object> entree = new HashMap<>();
        entree.put("livreur", mapping.getNomLivreur());
        entree.put("ville", mapping.getVille());
        entree.put("typeStock", mapping.getTypeStock().name());
        entree.put("produit", nomProduit);
        entree.put("quantite", quantite);
        entree.put("statut", "Stock non trouvé");

        resultatsParPays.get(pays).add(entree);
    }

    /**
     * Ajoute une entrée aux résultats par pays
     */
    private void addToResults(Map<String, List<Map<String, Object>>> resultatsParPays,
                        String pays, String ville, TypeStock typeStock,
                        String nomLivreur, Produit produit, int quantite, boolean stockUpdated) {

        if (!resultatsParPays.containsKey(pays)) {
            resultatsParPays.put(pays, new ArrayList<>());
        }

        Map<String, Object> entree = new HashMap<>();
        entree.put("livreur", nomLivreur);
        entree.put("ville", ville);
        entree.put("typeStock", typeStock.name());
        entree.put("produitId", produit.getId());
        entree.put("produitNom", produit.getNom());
        entree.put("produitReference", produit.getReference());
        entree.put("quantite", quantite);
        entree.put("statut", stockUpdated ? "Stock mis à jour" : "Échec de la mise à jour");

        resultatsParPays.get(pays).add(entree);
    }

    /**
     * Décrémente la quantité d'un produit dans un stock
     * @return true si la mise à jour a réussi, false sinon
     */
    private boolean decrementStock(Stock stock, Produit produit, int quantiteADecrementer) {
        try {
            System.out.println("\n=== MISE À JOUR STOCK ===");
            System.out.println("Stock: " + stock.getNom());
            System.out.println("Produit à décrementer:");
            System.out.println("   -> Nom: " + produit.getNom());
            System.out.println("   -> Référence: " + produit.getReference());

            // 1. Récupérer l'association existante
            Optional<ProduitStock> produitStockOpt = produitStockRepository
                .findByStock_IdAndProduit_Id(stock.getId(), produit.getId());

            if (produitStockOpt.isEmpty()) {
                System.out.println("❌ IGNORÉ: Produit non affecté à ce stock");
                return false;
            }

            // 2. Vérifier la quantité disponible
            ProduitStock produitStock = produitStockOpt.get();
            int quantiteActuelle = produitStock.getQuantite();

            if (quantiteActuelle < quantiteADecrementer) {
                System.out.println("❌ IGNORÉ: Stock insuffisant");
                System.out.println("   -> Disponible: " + quantiteActuelle);
                System.out.println("   -> Demandé: " + quantiteADecrementer);
                return false;
            }

            // 3. Mettre à jour UNIQUEMENT la quantité
            int nouvelleQuantite = quantiteActuelle - quantiteADecrementer;
            produitStock.setQuantite(nouvelleQuantite);
            
            // 4. Sauvegarder sans créer de nouvelle instance
            ProduitStock result = produitStockRepository.save(produitStock);
            
            // 5. Vérifier le résultat
            System.out.println("✅ Stock mis à jour:");
            System.out.println("   -> Produit: " + result.getProduit().getNom());
            System.out.println("   -> Référence: " + result.getProduit().getReference());
            System.out.println("   -> Quantité: " + quantiteActuelle + " -> " + nouvelleQuantite);
            
            if (nouvelleQuantite == 0) {
                System.out.println("ℹ️ Quantité zéro - Association maintenue avec données d'origine");
            }

            return true;

        } catch (Exception e) {
            System.out.println("❌ Erreur mise à jour: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Récupère la valeur d'une cellule sous forme de chaîne
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    Date date = cell.getDateCellValue();
                    SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy");
                    return formatter.format(date);
                } else {
                    // Pour éviter l'affichage scientifique des nombres
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (IllegalStateException e) {
                    try {
                        return cell.getStringCellValue();
                    } catch (IllegalStateException ex) {
                        return "";
                    }
                }
            default:
                return "";
        }
    }

    /**
     * Recherche un stock unique basé sur la ville et le type de stock
     */
    private Stock findUniqueStock(MappingLivreur mapping) {
        System.out.println("\n=== RECHERCHE STOCK ===");
        System.out.println("Prestataire (Nom du stock): " + mapping.getPrestataire());
        
        // Rechercher uniquement par le nom du prestataire
        Optional<Stock> stockOpt = stockRepository.findByNom(mapping.getPrestataire());
        
        if (stockOpt.isEmpty()) {
            System.out.println("❌ Stock non trouvé pour le prestataire: " + mapping.getPrestataire());
            return null;
        }

        Stock stock = stockOpt.get();
        System.out.println("✅ Stock trouvé: " + stock.getNom());
        return stock;
    }

    private Produit findProduitByName(String nomProduit) {
        String nomNormalise = nomProduit.trim();
        System.out.println("\n=== RECHERCHE PRODUIT ===");
        System.out.println("Nom produit recherché: " + nomNormalise);

        // Recherche stricte par nom exact - pas de création/modification
        Produit produit = produitRepository.findProduitByNom(nomNormalise);

        if (produit == null) {
            System.out.println("❌ Produit non trouvé dans le catalogue: " + nomNormalise);
            System.out.println("   -> Ignoré (pas de création/remplacement)");
            return null;
        }

        System.out.println("✅ Produit existant trouvé:");
        System.out.println("   -> ID: " + produit.getId());
        System.out.println("   -> Nom: " + produit.getNom());
        System.out.println("   -> Référence: " + produit.getReference());
        
        return produit;
    }

    private Produit findExistingProduit(String nomProduit) {
        String nomNormalise = nomProduit.trim();
        System.out.println("\n=== RECHERCHE PRODUIT ===");
        System.out.println("Nom produit recherché: " + nomNormalise);

        // Rechercher uniquement par nom exact
        Produit produit = produitRepository.findProduitByNom(nomNormalise);

        if (produit != null) {
            System.out.println("✅ Produit trouvé: " + produit.getNom() + " (ID: " + produit.getId() + ")");
            return produit;
        }

        System.out.println("❌ Produit non trouvé dans le catalogue: " + nomNormalise);
        System.out.println("   -> Le produit doit être créé manuellement");
        return null;
    }

    private boolean processHeaders(Row row, int[] columns) {
        System.out.println("\n=== ANALYSE EN-TÊTES ===");
        
        for (int c = 0; c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null) {
                String header = getCellValueAsString(cell).trim().toLowerCase();
                System.out.println("Colonne " + c + ": " + header);
                
                if (header.contains("livreur")) columns[0] = c;
                else if (header.contains("produit")) columns[1] = c;
                else if (header.contains("quantit")) columns[2] = c;
                else if (header.contains("date")) columns[3] = c;
            }
        }

        boolean valid = columns[0] >= 0 && columns[1] >= 0 && columns[2] >= 0;
        
        if (valid) {
            System.out.println("✅ En-têtes trouvées:");
            System.out.println("   Livreur: colonne " + columns[0]);
            System.out.println("   Produit: colonne " + columns[1]);
            System.out.println("   Quantité: colonne " + columns[2]);
            if (columns[3] >= 0) System.out.println("   Date: colonne " + columns[3]);
        } else {
            System.out.println("❌ En-têtes manquantes");
        }
        
        return valid;
    }

    private boolean validateBasicData(String nomLivreur, String nomProduit, String quantite) {
        return !nomLivreur.isEmpty() && !nomProduit.isEmpty() && !quantite.isEmpty();
    }

    private boolean validateDate(Cell dateCell, String dateSpecifiee) {
        String dateValue = getCellValueAsString(dateCell).trim();
        return dateValue.contains(dateSpecifiee);
    }

    private int parseQuantite(String quantiteStr) {
        try {
            return Integer.parseInt(quantiteStr);
        } catch (NumberFormatException e) {
            try {
                return (int) Double.parseDouble(quantiteStr);
            } catch (NumberFormatException ex) {
                return 0;
            }
        }
    }

    private boolean validateVille(String villeStock, String villeSpecifiee) {
        return villeSpecifiee == null || villeSpecifiee.isEmpty() || 
               villeSpecifiee.equalsIgnoreCase(villeStock);
    }

    private boolean validatePays(String paysStock, String paysSpecifie) {
        return paysSpecifie == null || paysSpecifie.isEmpty() || 
               paysSpecifie.equalsIgnoreCase(paysStock);
    }

    private String determinerPays(Stock stock, String paysSpecifie) {
        String pays = stock.getPays();
        return (pays == null || pays.isEmpty()) ? 
               ((paysSpecifie != null && !paysSpecifie.isEmpty()) ? paysSpecifie : "Non défini") : 
               pays;
    }

    private void completeResults(Map<String, Object> resultat, 
                               Map<String, List<Map<String, Object>>> resultatsParPays,
                               int totalLivraisons, int totalProduits, Set<String> livreursUniques) {
        // Statistiques globales
        Map<String, Object> statistiquesGlobales = new HashMap<>();
        statistiquesGlobales.put("totalLivraisons", totalLivraisons);
        statistiquesGlobales.put("totalProduits", totalProduits);
        statistiquesGlobales.put("nombreLivreurs", livreursUniques.size());

        // Statistiques par pays
        Map<String, Object> statistiquesParPays = new HashMap<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : resultatsParPays.entrySet()) {
            String pays = entry.getKey();
            List<Map<String, Object>> livraisons = entry.getValue();

            Map<String, Object> statsPaysCourant = new HashMap<>();
            
            // Compter les livraisons réussies et échouées
            long livraisonsReussies = livraisons.stream()
                .filter(l -> l.get("statut").equals("Stock mis à jour"))
                .count();
                
            long livraisonsEchouees = livraisons.size() - livraisonsReussies;

            // Calculer le total des quantités
            int quantiteTotal = livraisons.stream()
                .mapToInt(l -> (int) l.get("quantite"))
                .sum();

            // Collecter les villes uniques
            Set<String> villesUniques = livraisons.stream()
                .map(l -> (String) l.get("ville"))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

            statsPaysCourant.put("nombreLivraisons", livraisons.size());
            statsPaysCourant.put("livraisonsReussies", livraisonsReussies);
            statsPaysCourant.put("livraisonsEchouees", livraisonsEchouees);
            statsPaysCourant.put("quantiteTotal", quantiteTotal);
            statsPaysCourant.put("nombreVilles", villesUniques.size());
            statsPaysCourant.put("villes", new ArrayList<>(villesUniques));
            
            statistiquesParPays.put(pays, statsPaysCourant);
        }

        // Résultats détaillés
        resultat.put("statistiquesGlobales", statistiquesGlobales);
        resultat.put("statistiquesParPays", statistiquesParPays);
        resultat.put("resultatsParPays", resultatsParPays);
        resultat.put("livreurs", new ArrayList<>(livreursUniques));
    }
}