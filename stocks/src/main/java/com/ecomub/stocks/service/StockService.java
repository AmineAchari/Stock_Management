package com.ecomub.stocks.service;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.model.TypeStock;
import com.ecomub.stocks.repository.StockRepository;
import com.ecomub.stocks.repository.ProduitStockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Ajouter les imports nécessaires
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StockService {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private ProduitStockRepository produitStockRepository;

    // Créer un stock
    public Stock createStock(Stock stock) {
        try {
            return stockRepository.save(stock);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Un stock avec le nom '" + stock.getNom() + "' existe déjà.");
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
    public Stock updateStock(Long id, Stock stockDetails) {
        Optional<Stock> optionalStock = stockRepository.findById(id);
        if (optionalStock.isPresent()) {
            Stock stock = optionalStock.get();
            stock.setNom(stockDetails.getNom());
            stock.setAdresse(stockDetails.getAdresse());
            stock.setVille(stockDetails.getVille());
            stock.setPays(stockDetails.getPays());
            stock.setTypeStock(stockDetails.getTypeStock());
            try {
                return stockRepository.save(stock);
            } catch (DataIntegrityViolationException e) {
                throw new RuntimeException("Un stock avec le nom '" + stockDetails.getNom() + "' existe déjà.");
            }
        } else {
            throw new RuntimeException("Stock non trouvé avec l'ID : " + id);
        }
    }

    // Récupérer les stocks groupés par pays
    public Map<String, List<Stock>> getStocksByCountry() {
        List<Stock> allStocks = getAllStocks();
        
        // Grouper les stocks par pays
        Map<String, List<Stock>> stocksByCountry = allStocks.stream()
                .filter(stock -> stock.getPays() != null && !stock.getPays().isEmpty())
                .collect(Collectors.groupingBy(Stock::getPays));
        
        // Pour les stocks sans pays défini, les grouper sous "Non défini"
        List<Stock> stocksWithoutCountry = allStocks.stream()
                .filter(stock -> stock.getPays() == null || stock.getPays().isEmpty())
                .collect(Collectors.toList());
        
        if (!stocksWithoutCountry.isEmpty()) {
            stocksByCountry.put("Non défini", stocksWithoutCountry);
        }
        
        return stocksByCountry;
    }

    @Transactional
    public void deleteStock(Long id) {
        // Récupérer le stock
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock non trouvé avec l'ID : " + id));
        
        // Supprimer d'abord toutes les associations produit-stock liées à ce stock
        produitStockRepository.deleteByStockId(id);
        
        // Maintenant que toutes les associations sont supprimées, supprimer le stock
        stockRepository.delete(stock);
    }

    /**
     * Corrige les pays des stocks en fonction des villes
     * @return Le nombre de stocks mis à jour
     */
    @Transactional
    public int correctStockCountries() {
        List<Stock> allStocks = getAllStocks();
        int updatedCount = 0;
        
        for (Stock stock : allStocks) {
            // Toutes ces villes sont en RDC
            if (stock.getVille() != null && (
                stock.getVille().equalsIgnoreCase("KINSHASA") ||
                stock.getVille().equalsIgnoreCase("LUBUMBASHI") ||
                stock.getVille().equalsIgnoreCase("BUKAVU") ||
                stock.getVille().equalsIgnoreCase("GOMA") ||
                stock.getVille().equalsIgnoreCase("KISANGANI") ||
                stock.getVille().equalsIgnoreCase("KOLWEZI") ||
                stock.getVille().equalsIgnoreCase("LIKASI") ||
                stock.getVille().equalsIgnoreCase("MATADI") ||
                stock.getVille().equalsIgnoreCase("MBUJI MAYI") ||
                stock.getVille().equalsIgnoreCase("BUTEMBO") ||
                stock.getVille().equalsIgnoreCase("BENI") ||
                stock.getVille().equalsIgnoreCase("KANANGA") ||
                stock.getVille().equalsIgnoreCase("BOMA") ||
                stock.getVille().equalsIgnoreCase("KALEMIE") ||
                stock.getVille().equalsIgnoreCase("UVIRA") ||
                stock.getVille().equalsIgnoreCase("BUNIA") ||
                stock.getVille().equalsIgnoreCase("ISIRO"))) {
                
                // Si le pays est incorrect, le corriger
                if (!"République Démocratique du Congo".equals(stock.getPays()) && !"RDC".equals(stock.getPays())) {
                    stock.setPays("RDC");
                    stockRepository.save(stock);
                    updatedCount++;
                }
            }
            
            // Ajoutez d'autres règles pour d'autres pays si nécessaire
        }
        
        return updatedCount;
    }

    /**
     * Exporte les détails d'un stock au format Excel
     */
    public ByteArrayInputStream exportStockDetails(Long stockId) throws IOException {
        Stock stock = stockRepository.findById(stockId)
            .orElseThrow(() -> new RuntimeException("Stock non trouvé avec l'ID : " + stockId));
        
        List<ProduitStock> produitStocks = produitStockRepository.findByStock_Id(stockId);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Détails Stock");

            // Style pour les en-têtes
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Créer l'en-tête avec les informations du stock
            Row stockInfoRow = sheet.createRow(0);
            createCell(stockInfoRow, 0, "Nom du stock:", headerStyle);
            createCell(stockInfoRow, 1, stock.getNom(), null);

            Row locationRow = sheet.createRow(1);
            createCell(locationRow, 0, "Localisation:", headerStyle);
            createCell(locationRow, 1, stock.getVille() + ", " + stock.getPays(), null);

            // En-têtes du tableau
            Row headerRow = sheet.createRow(3);
            String[] columns = {"ID", "Produit", "Référence", "Quantité", "Seuil Alerte", "Statut"};
            for (int i = 0; i < columns.length; i++) {
                createCell(headerRow, i, columns[i], headerStyle);
            }

            // Données des produits
            int rowNum = 4;
            for (ProduitStock ps : produitStocks) {
                Row row = sheet.createRow(rowNum++);
                Produit produit = ps.getProduit();
                
                //row.createCell(0).setCellValue(produit.getId());
                row.createCell(2).setCellValue(produit.getReference());
                row.createCell(1).setCellValue(produit.getNom());
                row.createCell(3).setCellValue(ps.getQuantite());
                //row.createCell(4).setCellValue(produit.getSeuilAlerte());
                //row.createCell(5).setCellValue(getStockStatus(ps.getQuantite(), produit.getSeuilAlerte()));
            }

            // Ajuster la largeur des colonnes
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return new ByteArrayInputStream(outputStream.toByteArray());
        }
    }

    private void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value);
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private String getStockStatus(int quantite, int seuil) {
        if (quantite == 0) return "STOCK ÉPUISÉ";
        if (quantite <= seuil) return "STOCK FAIBLE";
        return "STOCK NORMAL";
    }
}
