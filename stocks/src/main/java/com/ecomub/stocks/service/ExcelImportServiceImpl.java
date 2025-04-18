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
                        throw new Exception("En-têtes requises non trouvées dans le fichier (Livreur, Produit, Quantité)");
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
            throw new Exception("Erreur lors de l'importation des livraisons: " + e.getMessage(), e);
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
        } catch (Exception e) {
            throw new Exception("Erreur lors de l'importation des produits: " + e.getMessage(), e);
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
            // findColumns retourne maintenant {nom, pays, ville}
            int[] columns = findColumns(headerRow);

            if (!validateColumns(columns)) {
                throw new Exception("Format de fichier invalide: colonnes Prestataire, Pays et Ville requises");
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // Lire les valeurs des colonnes Prestataire, Pays et Ville
                String nom = getCellValueAsString(row.getCell(columns[0])).trim();
                String pays = getCellValueAsString(row.getCell(columns[1])).trim(); // Nouvelle lecture
                String ville = getCellValueAsString(row.getCell(columns[2])).trim(); // Index ajusté

                // Vérifier si les colonnes obligatoires sont vides
                if (nom.isEmpty() || pays.isEmpty() || ville.isEmpty()) {
                    Map<String, Object> skipped = new HashMap<>();
                    skipped.put("nom", nom.isEmpty() ? "<Vide>" : nom);
                    skipped.put("pays", pays.isEmpty() ? "<Vide>" : pays);
                    skipped.put("ville", ville.isEmpty() ? "<Vide>" : ville);
                    skipped.put("status", "Ignoré - Données manquantes (Prestataire, Pays ou Ville)");
                    importedStocks.add(skipped);
                    totalSkipped++;
                    continue;
                }

                try {
                    // Vérifier si un stock avec le même nom existe déjà
                    if (stockRepository.findByNom(nom).isPresent()) {
                        Map<String, Object> skipped = new HashMap<>();
                        skipped.put("nom", nom);
                        skipped.put("pays", pays);
                        skipped.put("ville", ville);
                        skipped.put("status", "Ignoré - Stock existant (basé sur le nom)");
                        importedStocks.add(skipped);
                        totalSkipped++;
                        continue;
                    }

                    // Créer le nouveau stock
                    Stock stock = new Stock();
                    stock.setNom(nom);
                    stock.setVille(ville);
                    stock.setPays(pays); // Utiliser le pays lu depuis le fichier
                    stock.setTypeStock(TypeStock.PRESTATAIRE); // Type par défaut

                    stock = stockRepository.save(stock);

                    // Ajouter aux résultats réussis
                    Map<String, Object> imported = new HashMap<>();
                    imported.put("nom", nom);
                    imported.put("ville", ville);
                    imported.put("pays", stock.getPays()); // Pays enregistré
                    imported.put("typeStock", stock.getTypeStock().name());
                    imported.put("status", "Importé avec succès");
                    importedStocks.add(imported);
                    totalSuccess++;

                } catch (Exception e) {
                    // Gérer les erreurs potentielles (ex: violation de contrainte)
                    Map<String, Object> error = new HashMap<>();
                    error.put("nom", nom);
                    error.put("pays", pays);
                    error.put("ville", ville);
                    error.put("status", "Erreur: " + e.getMessage());
                    importedStocks.add(error);
                    totalSkipped++;
                }
            }
        } catch (Exception e) {
            throw new Exception("Erreur lors de l'importation des stocks: " + e.getMessage(), e);
        }

        result.put("stocks", importedStocks);
        result.put("totalImportes", totalSuccess);
        result.put("totalIgnores", totalSkipped);

        return result;
    }

    /**
     * Trouve les indices des colonnes Prestataire, Pays et Ville dans l'en-tête.
     * @param headerRow La ligne d'en-tête du fichier Excel.
     * @return Un tableau d'entiers: {indexPrestataire, indexPays, indexVille}. -1 si non trouvé.
     */
    private int[] findColumns(Row headerRow) {
        // Tableau pour stocker les indices: 0=Prestataire, 1=Pays, 2=Ville
        int[] columns = new int[3];
        Arrays.fill(columns, -1); // Initialiser avec -1 (non trouvé)

        if (headerRow == null) {
            return columns; // Retourner les indices non trouvés si pas d'en-tête
        }

        for (Cell cell : headerRow) {
            String header = getCellValueAsString(cell).trim().toLowerCase();
            int columnIndex = cell.getColumnIndex();

            if (header.contains("prestataire")) {
                columns[0] = columnIndex;
            } else if (header.contains("pays")) {
                columns[1] = columnIndex; // Chercher la colonne Pays
            } else if (header.contains("ville")) {
                columns[2] = columnIndex; // Chercher la colonne Ville
            }
        }

        return columns;
    }

    /**
     * Valide si les indices des colonnes Prestataire, Pays et Ville ont été trouvés.
     * @param columns Le tableau d'indices retourné par findColumns.
     * @return true si toutes les colonnes requises ont été trouvées, false sinon.
     */
    private boolean validateColumns(int[] columns) {
        // Vérifier que les indices pour Prestataire (0), Pays (1) et Ville (2) sont >= 0
        return columns[0] >= 0 && columns[1] >= 0 && columns[2] >= 0;
    }

    // --- Les autres méthodes de la classe restent inchangées ---
    // (getCellValueAsString, findMatchingLivreurMapping, addToNonMappedResults, etc.)

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
        // Ajoutez ici une logique de recherche partielle si nécessaire, sinon retournez null
        return null;
    }

    /**
     * Ajoute une entrée aux résultats pour les produits sans mapping
     */
    private void addToNonMappedResults(Map<String, List<Map<String, Object>>> resultatsParPays,
                                 String nomLivreur, String nomProduit, int quantite) {
        String pays = "Non mappé";

        resultatsParPays.computeIfAbsent(pays, k -> new ArrayList<>());

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

        resultatsParPays.computeIfAbsent(pays, k -> new ArrayList<>());

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

        resultatsParPays.computeIfAbsent(pays, k -> new ArrayList<>());

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
            System.out.println("\n=== MISE À JOUR STOCK (Décrémentation) ===");
            System.out.println("Stock: " + stock.getNom() + " (ID: " + stock.getId() + ")");
            System.out.println("Produit: " + produit.getNom() + " (ID: " + produit.getId() + ")");
            System.out.println("Quantité à décrémenter: " + quantiteADecrementer);

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
            System.out.println("   -> Quantité actuelle: " + quantiteActuelle);

            if (quantiteActuelle < quantiteADecrementer) {
                System.out.println("❌ IGNORÉ: Stock insuffisant");
                System.out.println("   -> Demandé: " + quantiteADecrementer);
                return false;
            }

            // 3. Mettre à jour UNIQUEMENT la quantité
            int nouvelleQuantite = quantiteActuelle - quantiteADecrementer;
            produitStock.setQuantite(nouvelleQuantite);

            // 4. Sauvegarder la modification
            ProduitStock result = produitStockRepository.save(produitStock);

            // 5. Vérifier le résultat
            System.out.println("✅ Stock mis à jour:");
            System.out.println("   -> Nouvelle quantité: " + nouvelleQuantite);

            return true;

        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la décrémentation du stock pour le produit " + produit.getId() + " dans le stock " + stock.getId() + ": " + e.getMessage());
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
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    Date date = cell.getDateCellValue();
                    SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy"); // Format de date commun
                    return formatter.format(date);
                } else {
                    // Gérer les nombres entiers et décimaux correctement
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == Math.floor(numericValue)) {
                        // C'est un entier
                        return String.valueOf((long) numericValue);
                    } else {
                        // C'est un nombre décimal
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                // Tenter d'évaluer la formule
                try {
                    // Essayer comme numérique d'abord
                    double numericValue = cell.getNumericCellValue();
                     if (numericValue == Math.floor(numericValue)) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                } catch (IllegalStateException e) {
                    // Si ce n'est pas numérique, essayer comme chaîne
                    try {
                        return cell.getStringCellValue().trim();
                    } catch (IllegalStateException ex) {
                        // Si l'évaluation échoue, retourner une chaîne vide ou un marqueur d'erreur
                        System.err.println("Impossible d'évaluer la formule dans la cellule: " + cell.getAddress());
                        return ""; // Ou retourner une indication d'erreur
                    }
                }
            case BLANK: // Gérer explicitement les cellules vides
                return "";
            default:
                return "";
        }
    }

    /**
     * Recherche un stock unique basé sur le nom du prestataire (stock).
     */
    private Stock findUniqueStock(MappingLivreur mapping) {
        System.out.println("\n=== RECHERCHE STOCK ===");
        String nomStock = mapping.getPrestataire(); // Le nom du stock vient du mapping
        System.out.println("Nom du stock recherché (via mapping prestataire): " + nomStock);

        // Rechercher uniquement par le nom du stock
        Optional<Stock> stockOpt = stockRepository.findByNom(nomStock);

        if (stockOpt.isEmpty()) {
            System.out.println("❌ Stock non trouvé pour le nom: " + nomStock);
            return null;
        }

        Stock stock = stockOpt.get();
        System.out.println("✅ Stock trouvé: " + stock.getNom() + " (ID: " + stock.getId() + ", Ville: " + stock.getVille() + ", Pays: " + stock.getPays() + ")");
        return stock;
    }

    /**
     * Recherche un produit existant par son nom exact. Ne crée pas de nouveau produit.
     */
    private Produit findProduitByName(String nomProduit) {
        String nomNormalise = nomProduit.trim();
        System.out.println("\n=== RECHERCHE PRODUIT ===");
        System.out.println("Nom produit recherché: " + nomNormalise);

        // Recherche stricte par nom exact
        Produit produit = produitRepository.findProduitByNom(nomNormalise);

        if (produit == null) {
            System.out.println("❌ Produit non trouvé dans le catalogue: " + nomNormalise);
            System.out.println("   -> Ignoré (le produit doit exister)");
            return null;
        }

        System.out.println("✅ Produit existant trouvé:");
        System.out.println("   -> ID: " + produit.getId());
        System.out.println("   -> Nom: " + produit.getNom());
        System.out.println("   -> Référence: " + produit.getReference());

        return produit;
    }

    /**
     * Traite la ligne d'en-tête pour trouver les indices des colonnes requises pour l'import de livraison.
     * @param row La ligne d'en-tête.
     * @param columns Tableau pour stocker les indices {livreur, produit, quantite, date}.
     * @return true si les colonnes Livreur, Produit et Quantité sont trouvées, false sinon.
     */
    private boolean processHeaders(Row row, int[] columns) {
        System.out.println("\n=== ANALYSE EN-TÊTES (Livraison) ===");
        Arrays.fill(columns, -1); // Réinitialiser les indices

        if (row == null) {
             System.out.println("❌ Ligne d'en-tête vide ou nulle.");
             return false;
        }

        for (int c = 0; c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null) {
                String header = getCellValueAsString(cell).trim().toLowerCase();
                System.out.println("Colonne " + c + ": '" + header + "'");

                if (header.contains("livreur")) columns[0] = c;
                else if (header.contains("produit")) columns[1] = c;
                else if (header.contains("quantit")) columns[2] = c; // Accepte "quantité", "quantite", etc.
                else if (header.contains("date")) columns[3] = c; // Colonne date optionnelle
            }
        }

        // Vérifier si les colonnes obligatoires (Livreur, Produit, Quantité) ont été trouvées
        boolean valid = columns[0] >= 0 && columns[1] >= 0 && columns[2] >= 0;

        if (valid) {
            System.out.println("✅ En-têtes requises trouvées:");
            System.out.println("   Livreur: colonne " + columns[0]);
            System.out.println("   Produit: colonne " + columns[1]);
            System.out.println("   Quantité: colonne " + columns[2]);
            if (columns[3] >= 0) {
                System.out.println("   Date (Optionnel): colonne " + columns[3]);
            } else {
                 System.out.println("   Date (Optionnel): non trouvée");
            }
        } else {
            System.out.println("❌ En-têtes manquantes! Requises: 'Livreur', 'Produit', 'Quantité'.");
            if(columns[0] < 0) System.out.println("   -> Colonne 'Livreur' non trouvée.");
            if(columns[1] < 0) System.out.println("   -> Colonne 'Produit' non trouvée.");
            if(columns[2] < 0) System.out.println("   -> Colonne 'Quantité' non trouvée.");
        }

        return valid;
    }

    private boolean validateBasicData(String nomLivreur, String nomProduit, String quantite) {
        return !nomLivreur.isEmpty() && !nomProduit.isEmpty() && !quantite.isEmpty();
    }

    private boolean validateDate(Cell dateCell, String dateSpecifiee) {
        if (dateCell == null) return false; // Pas de date à vérifier si la cellule est nulle
        String dateValue = getCellValueAsString(dateCell).trim();
        // Vérifier si la date lue contient la date spécifiée (format dd/MM/yyyy attendu)
        return dateValue.equals(dateSpecifiee); // Utiliser equals pour une correspondance exacte
    }

    private int parseQuantite(String quantiteStr) {
        try {
            // Essayer de parser comme entier d'abord
            return Integer.parseInt(quantiteStr);
        } catch (NumberFormatException e) {
            // Si échec, essayer comme double puis convertir en entier
            try {
                double doubleValue = Double.parseDouble(quantiteStr);
                // Attention: perte potentielle de précision si la quantité n'est pas entière
                return (int) doubleValue;
            } catch (NumberFormatException ex) {
                // Si les deux échouent, retourner 0 ou logger une erreur
                 System.err.println("Impossible de parser la quantité: '" + quantiteStr + "'");
                return 0;
            }
        }
    }

    private boolean validateVille(String villeStock, String villeSpecifiee) {
        // Si aucune ville n'est spécifiée, on ne filtre pas
        if (villeSpecifiee == null || villeSpecifiee.isEmpty()) {
            return true;
        }
        // Comparaison insensible à la casse
        return villeSpecifiee.equalsIgnoreCase(villeStock);
    }

    private boolean validatePays(String paysStock, String paysSpecifie) {
         // Si aucun pays n'est spécifié, on ne filtre pas
        if (paysSpecifie == null || paysSpecifie.isEmpty()) {
            return true;
        }
        // Comparaison insensible à la casse
        return paysSpecifie.equalsIgnoreCase(paysStock);
    }

    private String determinerPays(Stock stock, String paysSpecifie) {
        String paysDuStock = stock.getPays();
        // Si le stock a un pays défini, on l'utilise
        if (paysDuStock != null && !paysDuStock.isEmpty()) {
            return paysDuStock;
        }
        // Sinon, si un pays a été spécifié en paramètre, on l'utilise
        if (paysSpecifie != null && !paysSpecifie.isEmpty()) {
            return paysSpecifie;
        }
        // En dernier recours, on retourne "Non défini"
        return "Non défini";
    }

    private void completeResults(Map<String, Object> resultat,
                               Map<String, List<Map<String, Object>>> resultatsParPays,
                               int totalLivraisons, int totalProduits, Set<String> livreursUniques) {
        // Statistiques globales
        Map<String, Object> statistiquesGlobales = new HashMap<>();
        statistiquesGlobales.put("totalLivraisonsTraitees", totalLivraisons); // Livraisons où le stock a été mis à jour
        statistiquesGlobales.put("totalProduitsLivres", totalProduits); // Quantité totale des produits livrés avec succès
        statistiquesGlobales.put("nombreLivreursUniques", livreursUniques.size());

        // Statistiques par pays
        Map<String, Object> statistiquesParPays = new HashMap<>();
        int totalLignesTraitees = 0;
        int totalLignesReussies = 0;
        int totalLignesEchouees = 0;

        for (Map.Entry<String, List<Map<String, Object>>> entry : resultatsParPays.entrySet()) {
            String pays = entry.getKey();
            List<Map<String, Object>> livraisons = entry.getValue();
            totalLignesTraitees += livraisons.size();

            Map<String, Object> statsPaysCourant = new HashMap<>();

            // Compter les livraisons réussies et échouées pour ce pays/groupe
            long livraisonsReussies = livraisons.stream()
                .filter(l -> "Stock mis à jour".equals(l.get("statut")))
                .count();
            totalLignesReussies += livraisonsReussies;

            long livraisonsEchouees = livraisons.size() - livraisonsReussies;
            totalLignesEchouees += livraisonsEchouees;

            // Calculer le total des quantités pour les livraisons réussies dans ce pays/groupe
            int quantiteTotalReussie = livraisons.stream()
                .filter(l -> "Stock mis à jour".equals(l.get("statut")))
                .mapToInt(l -> (int) l.get("quantite"))
                .sum();

            // Collecter les villes uniques pour ce pays/groupe
            Set<String> villesUniques = livraisons.stream()
                .map(l -> (String) l.get("ville"))
                .filter(Objects::nonNull) // Exclure les entrées sans ville (ex: Non mappé)
                .collect(Collectors.toSet());

            statsPaysCourant.put("nombreLignes", livraisons.size());
            statsPaysCourant.put("lignesReussies", livraisonsReussies);
            statsPaysCourant.put("lignesEchouees", livraisonsEchouees); // Inclut Non mappé, Stock non trouvé, etc.
            statsPaysCourant.put("quantiteTotalReussie", quantiteTotalReussie);
            statsPaysCourant.put("nombreVilles", villesUniques.size());
            statsPaysCourant.put("villes", new ArrayList<>(villesUniques));

            statistiquesParPays.put(pays, statsPaysCourant);
        }

        // Ajouter les totaux généraux au niveau global
        statistiquesGlobales.put("totalLignesFichier", totalLignesTraitees);
        statistiquesGlobales.put("totalLignesReussiesGlobal", totalLignesReussies);
        statistiquesGlobales.put("totalLignesEchoueesGlobal", totalLignesEchouees);


        // Ajouter les résultats au map final
        resultat.put("statistiquesGlobales", statistiquesGlobales);
        resultat.put("statistiquesParPays", statistiquesParPays);
        resultat.put("resultatsParPays", resultatsParPays); // Détails ligne par ligne groupés
        resultat.put("livreurs", new ArrayList<>(livreursUniques)); // Liste des livreurs uniques des lignes réussies
    }
}
