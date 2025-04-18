package com.ecomub.stocks.service;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.model.TypeStock;
import com.ecomub.stocks.repository.StockRepository;
import com.ecomub.stocks.repository.ProduitStockRepository; // Correct import
import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.context.annotation.Lazy; // Lazy not strictly needed here unless circular dependency
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Ajouter les imports nécessaires
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime; // Importer LocalDateTime
import java.time.format.DateTimeFormatter; // Importer DateTimeFormatter
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.Collections;
import java.util.Set;
import java.util.Objects;

@Service
public class StockService {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private ProduitStockRepository produitStockRepository; // Correct repository

    // Créer un stock
    @Transactional // Added @Transactional for consistency
    public Stock createStock(Stock stock) {
        try {
            // Vérifier si un stock avec le même nom existe déjà (insensible à la casse)
            // Consider adding a specific query in Repository for case-insensitive check if DB doesn't handle it
            Optional<Stock> existingStock = stockRepository.findByNom(stock.getNom());
            if (existingStock.isPresent()) {
                 // Use a more specific exception or return a clear response object instead of generic RuntimeException
                 throw new DataIntegrityViolationException("Un stock avec le nom '" + stock.getNom() + "' existe déjà.");
            }
            return stockRepository.save(stock);
        } catch (DataIntegrityViolationException e) {
            // Log the error
            // Consider a custom exception hierarchy
            throw new RuntimeException("Un stock avec le nom '" + stock.getNom() + "' existe déjà ou une autre contrainte a été violée.", e);
        } catch (Exception e) {
             // Log the error
             throw new RuntimeException("Erreur inattendue lors de la création du stock.", e);
        }
    }

    // Récupérer tous les stocks
    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }

    // Récupérer un stock par ID
    public Optional<Stock> getStockById(Long id) {
        return stockRepository.findById(id);
    }

    // Mettre à jour un stock
    @Transactional // Assurer la transaction
    public Stock updateStock(Long id, Stock stockDetails) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock non trouvé avec l'ID : " + id)); // Consider a custom NotFoundException

        // Vérifier si le nouveau nom est différent et s'il existe déjà
        if (stockDetails.getNom() != null && !stock.getNom().equalsIgnoreCase(stockDetails.getNom())) {
            // Consider adding a specific query in Repository for case-insensitive check
            Optional<Stock> existingStockWithNewName = stockRepository.findByNom(stockDetails.getNom());
            // Ensure the found stock is not the same one we are updating
            if (existingStockWithNewName.isPresent() && !existingStockWithNewName.get().getId().equals(id)) {
                throw new RuntimeException("Un autre stock avec le nom '" + stockDetails.getNom() + "' existe déjà."); // Consider custom exception
            }
            stock.setNom(stockDetails.getNom());
        }

        // Update other fields only if they are provided in stockDetails (partial update pattern)
        if (stockDetails.getAdresse() != null) {
            stock.setAdresse(stockDetails.getAdresse());
        }
        if (stockDetails.getVille() != null) {
            stock.setVille(stockDetails.getVille());
        }
        if (stockDetails.getPays() != null) {
            stock.setPays(stockDetails.getPays());
        }
        if (stockDetails.getTypeStock() != null) {
            stock.setTypeStock(stockDetails.getTypeStock());
        }

        try {
            return stockRepository.save(stock);
        } catch (DataIntegrityViolationException e) {
            // This exception might still occur if another transaction creates a stock with the same name concurrently
            // Log the error
            throw new RuntimeException("Erreur de contrainte lors de la mise à jour du stock: " + e.getMessage(), e);
        } catch (Exception e) {
             // Log the error
             throw new RuntimeException("Erreur inattendue lors de la mise à jour du stock.", e);
        }
    }

    // Récupérer les stocks groupés par pays
    public Map<String, List<Stock>> getStocksByCountry() {
        List<Stock> allStocks = getAllStocks();

        // Grouper les stocks par pays, en gérant les pays null ou vides
        Map<String, List<Stock>> stocksByCountry = allStocks.stream()
                .collect(Collectors.groupingBy(
                    stock -> {
                        String pays = stock.getPays();
                        // Use Objects.toString(pays, "Non défini") for cleaner null handling?
                        return (pays != null && !pays.trim().isEmpty()) ? pays.trim() : "Non défini";
                    }
                ));

        return stocksByCountry;
    }

    @Transactional
    public void deleteStock(Long id) {
        // Vérifier l'existence avant de tenter la suppression pour une meilleure sémantique
        if (!stockRepository.existsById(id)) {
            throw new RuntimeException("Stock non trouvé avec l'ID : " + id); // Consider custom NotFoundException
        }

        // Supprimer d'abord toutes les associations produit-stock liées à ce stock
        // Ensure cascading delete isn't set up in JPA entity if manual deletion is intended
        produitStockRepository.deleteByStockId(id);

        // Maintenant que toutes les associations sont supprimées, supprimer le stock
        stockRepository.deleteById(id); // Use deleteById for efficiency if the entity isn't needed
    }

    /**
     * Corrige les pays des stocks en fonction des villes (Exemple pour RDC).
     * @return Le nombre de stocks mis à jour.
     */
    @Transactional
    public int correctStockCountries() {
        List<Stock> allStocks = getAllStocks();
        int updatedCount = 0;

        // Use constants for city names and country name
        final Set<String> RDC_CITIES = Set.of(
            "kinshasa", "lubumbashi", "bukavu", "goma", "kisangani",
            "kolwezi", "likasi", "matadi", "mbuji mayi", "butembo",
            "beni", "kananga", "boma", "kalemie", "uvira", "bunia", "isiro"
        );
        final String TARGET_COUNTRY_RDC = "RDC";
        final String TARGET_COUNTRY_RDC_FULL = "République Démocratique du Congo";

        List<Stock> stocksToUpdate = new ArrayList<>();

        for (Stock stock : allStocks) {
            String ville = stock.getVille();
            String currentPays = stock.getPays();

            if (ville != null && RDC_CITIES.contains(ville.trim().toLowerCase())) {
                // Si la ville est en RDC et le pays actuel n'est pas RDC (ou équivalent), corriger.
                boolean needsUpdate = currentPays == null || currentPays.trim().isEmpty() ||
                    (!currentPays.trim().equalsIgnoreCase(TARGET_COUNTRY_RDC) && !currentPays.trim().equalsIgnoreCase(TARGET_COUNTRY_RDC_FULL));

                if (needsUpdate) {
                    stock.setPays(TARGET_COUNTRY_RDC);
                    stocksToUpdate.add(stock); // Collect stocks to update
                    updatedCount++;
                }
            }
            // Ajoutez d'autres blocs 'else if' pour d'autres pays si nécessaire
            // else if (ville != null && OTHER_COUNTRY_CITIES.contains(ville.trim().toLowerCase())) { ... }
        }

        // Batch save for potentially better performance
        if (!stocksToUpdate.isEmpty()) {
            stockRepository.saveAll(stocksToUpdate);
        }

        return updatedCount;
    }

    /**
     * Exporte les détails d'un stock (informations + liste des produits) au format Excel.
     * @param stockId L'ID du stock à exporter.
     * @return Un ByteArrayInputStream contenant les données du fichier Excel.
     * @throws IOException Si une erreur d'écriture se produit.
     * @throws RuntimeException Si le stock n'est pas trouvé.
     */
    public ByteArrayInputStream exportStockDetails(Long stockId) throws IOException {
        Stock stock = stockRepository.findById(stockId)
            .orElseThrow(() -> new RuntimeException("Stock non trouvé avec l'ID : " + stockId)); // Consider custom NotFoundException

        // Fetch ProduitStock with associated Produit eagerly if possible (e.g., using JOIN FETCH in repository)
        List<ProduitStock> produitStocks = produitStockRepository.findByStock_Id(stockId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Détails Stock " + stock.getNom()); // Nom de feuille plus spécifique

            // --- Styles ---
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle defaultStyle = workbook.createCellStyle(); // Style par défaut si besoin
            // Consider adding more styles (e.g., for numbers, dates)

            // --- Informations du stock ---
            int currentRowIndex = 0;

            // Nom du stock
            Row stockInfoRow = sheet.createRow(currentRowIndex++);
            createCell(stockInfoRow, 0, "Nom du stock:", headerStyle);
            createCell(stockInfoRow, 1, stock.getNom(), defaultStyle);

            // Localisation
            Row locationRow = sheet.createRow(currentRowIndex++);
            createCell(locationRow, 0, "Localisation:", headerStyle);
            // Build localisation string more robustly
            List<String> locationParts = new ArrayList<>();
            if (stock.getVille() != null && !stock.getVille().trim().isEmpty()) {
                locationParts.add(stock.getVille().trim());
            }
            if (stock.getPays() != null && !stock.getPays().trim().isEmpty()) {
                locationParts.add(stock.getPays().trim());
            }
            createCell(locationRow, 1, String.join(", ", locationParts), defaultStyle);


            // Type de Stock
            Row typeRow = sheet.createRow(currentRowIndex++);
            createCell(typeRow, 0, "Type:", headerStyle);
            createCell(typeRow, 1, stock.getTypeStock() != null ? stock.getTypeStock().name() : "Non défini", defaultStyle);

            // Date d'exportation
            Row exportDateRow = sheet.createRow(currentRowIndex++);
            createCell(exportDateRow, 0, "Date d'exportation:", headerStyle);
            LocalDateTime now = LocalDateTime.now();
            // Use a constant for the date format pattern
            final String DATE_TIME_FORMAT_PATTERN = "dd/MM/yyyy HH:mm:ss";
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_TIME_FORMAT_PATTERN);
            createCell(exportDateRow, 1, now.format(formatter), defaultStyle); // Consider a specific date style

            // Ligne vide pour séparer
            currentRowIndex++;

            // --- En-têtes du tableau des produits ---
            Row headerRow = sheet.createRow(currentRowIndex++);
            // Use constants for column headers
            final String[] COLUMNS = {"Réf.", "Produit", "Quantité"};
            for (int i = 0; i < COLUMNS.length; i++) {
                createCell(headerRow, i, COLUMNS[i], headerStyle);
            }

            // --- Données des produits ---
            if (produitStocks.isEmpty()) {
                 Row emptyRow = sheet.createRow(currentRowIndex++);
                 createCell(emptyRow, 0, "Aucun produit affecté à ce stock.", null); // Message si vide
                 // Ensure merge range is correct
                 if (COLUMNS.length > 0) {
                    sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(currentRowIndex - 1, currentRowIndex - 1, 0, COLUMNS.length - 1));
                 }
            } else {
                // Trier les produits par référence ou nom si souhaité
                // Ensure getProduit() doesn't return null
                produitStocks.sort(Comparator.comparingInt(ps -> ps.getProduit() != null ? ps.getProduit().getReference() : 0));

                for (ProduitStock ps : produitStocks) {
                    Row row = sheet.createRow(currentRowIndex++);
                    Produit produit = ps.getProduit(); // Check for null if relationship is optional

                    if (produit != null) {
                        createCell(row, 0, produit.getReference(), defaultStyle); // Consider number style
                        createCell(row, 1, produit.getNom(), defaultStyle);
                        createCell(row, 2, ps.getQuantite(), defaultStyle);    // Consider number style
                    } else {
                        // Handle case where Produit is null (if possible)
                        createCell(row, 0, "Produit Inconnu", defaultStyle);
                        createCell(row, 1, "N/A", defaultStyle);
                        createCell(row, 2, ps.getQuantite(), defaultStyle);
                    }
                }
            }

            // Ajuster la largeur des colonnes
            for (int i = 0; i < COLUMNS.length; i++) {
                sheet.autoSizeColumn(i);
                // Add a small buffer to autosized columns
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 512);
            }
            // Specific width adjustment if needed
            // if (COLUMNS.length > 1) {
            //     sheet.setColumnWidth(1, Math.max(sheet.getColumnWidth(1), 4000)); // Example: min width
            // }


            workbook.write(outputStream);
            return new ByteArrayInputStream(outputStream.toByteArray());
        }
        // Catch specific IOExceptions and rethrow as needed, or handle them
    }

    /**
     * Génère un rapport de stock agrégé par localisation (ville ou pays).
     * Le rapport montre la quantité de chaque produit dans chaque stock de la localisation,
     * structuré pour faciliter l'affichage sous forme de tableau croisé.
     *
     * @param groupBy "ville" ou "pays" pour déterminer le niveau d'agrégation.
     * @return Une Map contenant les données du rapport structurées par localisation.
     *         Exemple de structure pour une localisation:
     *         {
     *           "stocks": ["Stock A", "Stock B"], // Noms des stocks (colonnes) triés
     *           "products": [ // Lignes de produits triées par référence
     *             {
     *               "ref": 101,
     *               "nom": "Produit X",
     *               "quantities": {"Stock A": 10, "Stock B": 5} // Quantités par stock
     *             },
     *             // ... autres produits
     *           ]
     *         }
     * @throws IllegalArgumentException si groupBy n'est pas "ville" ou "pays".
     */
    public Map<String, Object> generateStockReportByLocation(String groupBy) {
        final String GROUP_BY_VILLE = "ville";
        final String GROUP_BY_PAYS = "pays";
        final String LOCATION_UNDEFINED = "Non défini";

        if (!GROUP_BY_VILLE.equalsIgnoreCase(groupBy) && !GROUP_BY_PAYS.equalsIgnoreCase(groupBy)) {
            throw new IllegalArgumentException("Le paramètre 'groupBy' doit être '" + GROUP_BY_VILLE + "' ou '" + GROUP_BY_PAYS + "'.");
        }
        final String finalGroupBy = groupBy.toLowerCase(); // Pour utilisation dans lambda

        // *** CORRECTED LINE ***
        // Replace the non-existent method with findAll()
        // Consider creating a custom repository method with JOIN FETCH for performance
        List<ProduitStock> allProduitStocks = produitStockRepository.findAll();
        // List<ProduitStock> allProduitStocks = produitStockRepository.findAllWithProduitAndStock(); // Original line with error

        if (allProduitStocks.isEmpty()) {
            return Map.of("groupBy", finalGroupBy, "locations", Collections.emptyMap(), "message", "Aucune donnée de stock produit trouvée.");
        }

        // 1. Grouper les ProduitStock par la localisation choisie (ville ou pays)
        Map<String, List<ProduitStock>> groupedByLocation = allProduitStocks.stream()
            .filter(ps -> ps.getStock() != null && ps.getProduit() != null) // Filtrer données potentiellement invalides
            .collect(Collectors.groupingBy(ps -> {
                Stock stock = ps.getStock();
                String location;
                if (GROUP_BY_VILLE.equals(finalGroupBy)) {
                    location = stock.getVille();
                } else { // pays
                    location = stock.getPays();
                }
                // Gérer les localisations null ou vides
                return (location != null && !location.trim().isEmpty()) ? location.trim() : LOCATION_UNDEFINED;
            }));

        Map<String, Object> report = new HashMap<>();
        Map<String, Map<String, Object>> locationsReport = new HashMap<>();

        // 2. Traiter chaque localisation trouvée (triée par nom de localisation)
        List<String> sortedLocationNames = new ArrayList<>(groupedByLocation.keySet());
        Collections.sort(sortedLocationNames); // Consider case-insensitive sort: Collections.sort(sortedLocationNames, String.CASE_INSENSITIVE_ORDER);

        for (String locationName : sortedLocationNames) {
            List<ProduitStock> psList = groupedByLocation.get(locationName);

            if (psList == null || psList.isEmpty()) continue; // Should not happen with groupingBy result, but safe check

            Map<String, Object> locationData = new HashMap<>();

            // 3. Identifier les stocks uniques (par ID) et leurs noms triés pour cette localisation
            // Use a Map to collect unique stocks by ID first
            Map<Long, Stock> uniqueStocksMap = psList.stream()
                                                .map(ProduitStock::getStock)
                                                .filter(Objects::nonNull) // Ensure stock is not null
                                                .collect(Collectors.toMap(Stock::getId, stock -> stock, (existing, replacement) -> existing)); // Keep first encountered

            // Then get sorted names from the unique stocks
            List<String> stockNamesSorted = uniqueStocksMap.values().stream()
                                                .map(Stock::getNom)
                                                .filter(name -> name != null && !name.trim().isEmpty()) // Filtrer noms vides
                                                .distinct() // Ensure distinct names
                                                .sorted(String.CASE_INSENSITIVE_ORDER) // Tri insensible à la casse
                                                .collect(Collectors.toList());
            locationData.put("stocks", stockNamesSorted); // Noms des stocks pour les colonnes du tableau

            // 4. Identifier les produits uniques (par ID) et les trier (par référence) pour cette localisation
            Map<Long, Produit> uniqueProductsMap = psList.stream()
                                                .map(ProduitStock::getProduit)
                                                .filter(Objects::nonNull) // Ensure produit is not null
                                                .collect(Collectors.toMap(Produit::getId, prod -> prod, (existing, replacement) -> existing));

            List<Produit> sortedProducts = uniqueProductsMap.values().stream()
                                                .sorted(Comparator.comparingInt(Produit::getReference))
                                                .collect(Collectors.toList());

            // 5. Créer une structure de recherche rapide pour les quantités: Map<productId, Map<stockId, quantity>>
            Map<Long, Map<Long, Integer>> quantityLookup = new HashMap<>();
            for (ProduitStock ps : psList) {
                 // Assurer que produit et stock ne sont pas null et have IDs
                 if(ps.getProduit() != null && ps.getProduit().getId() != null &&
                    ps.getStock() != null && ps.getStock().getId() != null) {
                     quantityLookup
                        .computeIfAbsent(ps.getProduit().getId(), k -> new HashMap<>())
                        .put(ps.getStock().getId(), ps.getQuantite());
                 }
            }

            // 6. Construire les lignes de produits pour le rapport de cette localisation
            List<Map<String, Object>> productRows = new ArrayList<>();
            for (Produit product : sortedProducts) {
                Map<String, Object> productRow = new HashMap<>();
                productRow.put("ref", product.getReference());
                productRow.put("nom", product.getNom());

                // Map pour stocker les quantités {NomStock -> Quantité}
                // Use a LinkedHashMap if the insertion order (which matches stockNamesSorted) is important
                Map<String, Integer> quantities = new HashMap<>();
                // Itérer sur les noms de stock triés pour garantir l'ordre des colonnes
                for(String stockName : stockNamesSorted){
                    // Trouver le stock correspondant à ce nom dans cette localisation
                    // This lookup inside the loop can be inefficient if many stocks per location.
                    // Consider creating a Map<String, Long> stockNameToIdMap earlier.
                    Optional<Stock> stockOpt = uniqueStocksMap.values().stream()
                                                    .filter(s -> stockName.equals(s.getNom()))
                                                    .findFirst();

                    int quantity = 0; // Default quantity is 0
                    if(stockOpt.isPresent() && product.getId() != null){
                        // Récupérer la quantité depuis la lookup map
                         quantity = quantityLookup
                                        .getOrDefault(product.getId(), Collections.emptyMap())
                                        .getOrDefault(stockOpt.get().getId(), 0);
                    }
                     quantities.put(stockName, quantity);
                }

                productRow.put("quantities", quantities);
                productRows.add(productRow);
            }

            locationData.put("products", productRows); // Ajouter les lignes de produits
            locationsReport.put(locationName, locationData); // Ajouter les données de cette localisation au rapport global
        }

        report.put("groupBy", finalGroupBy);
        report.put("locations", locationsReport);

        return report;
    }


    // --- Méthodes utilitaires pour la création de cellules Excel ---

    /** Crée un style pour les cellules d'en-tête Excel. */
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setAlignment(HorizontalAlignment.CENTER); // Center align header text
        return headerStyle;
    }

    /** Crée une cellule avec une valeur String et un style optionnel. */
    private void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value != null ? value : ""); // Gérer les valeurs null
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    /** Crée une cellule avec une valeur long et un style optionnel. */
    private void createCell(Row row, int column, long value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value);
        if (style != null) {
            // Consider creating a specific number style
            cell.setCellStyle(style);
        }
    }

    /** Crée une cellule avec une valeur int et un style optionnel. */
    private void createCell(Row row, int column, int value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value);
        if (style != null) {
            // Consider creating a specific number style
            cell.setCellStyle(style);
        }
    }


    /**
     * Détermine le statut d'un stock basé sur la quantité et un seuil.
     * @param quantite La quantité actuelle.
     * @param seuil Le seuil de stock faible.
     * @return Le statut du stock ("STOCK ÉPUISÉ", "STOCK FAIBLE", "STOCK NORMAL").
     */
    private String getStockStatus(int quantite, int seuil) {
        // Use constants for status strings
        final String STATUS_EMPTY = "STOCK ÉPUISÉ";
        final String STATUS_LOW = "STOCK FAIBLE";
        final String STATUS_NORMAL = "STOCK NORMAL";

        if (quantite <= 0) { // Utiliser <= 0 pour inclure les cas négatifs potentiels
            return STATUS_EMPTY;
        }
        if (quantite <= seuil) {
            return STATUS_LOW;
        }
        return STATUS_NORMAL;
    }
}
