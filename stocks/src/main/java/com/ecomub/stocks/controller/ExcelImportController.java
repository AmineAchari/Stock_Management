package com.ecomub.stocks.controller;

import com.ecomub.stocks.model.MappingLivreur;
import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.model.TypeStock;
import com.ecomub.stocks.service.ExcelImportService;
import com.ecomub.stocks.repository.ProduitStockRepository;
import com.ecomub.stocks.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "http://localhost:3000/", maxAge = 3600)
public class ExcelImportController {

    private final ExcelImportService excelImportService;
    private final StockRepository stockRepository;

    @Autowired
    public ExcelImportController(
            ExcelImportService excelImportService,
            StockRepository stockRepository) {
        this.excelImportService = excelImportService;
        this.stockRepository = stockRepository;
    }
     
    @PostMapping("/livraisons")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> importLivraisons(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "pays", required = false) String pays,
            @RequestParam(value = "ville", required = false) String ville,
            @RequestParam(value = "date", required = false) String date) {
        try {
            // Validate input
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("Le fichier est requis");
            }

            // Process import
            Map<String, Object> result = excelImportService.importLivraisonData(file, pays, ville, date);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Fichier traité avec succès",
                "resultat", result
            ));

        } catch (Exception e) {
            // Log the full error
            System.err.println("Erreur lors de l'importation: " + e.getMessage());
            e.printStackTrace();

            // Return error response
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de l'importation: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/produits")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> importProduits(@RequestParam("file") MultipartFile file) {
        try {
            // Validate input
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le fichier est requis"
                ));
            }

            // Process import
            Map<String, Object> result = excelImportService.importProduitsData(file);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Produits importés avec succès",
                "resultat", result
            ));

        } catch (Exception e) {
            // Log the full error
            System.err.println("Erreur lors de l'importation des produits: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de l'importation: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/stocks")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> importStocks(@RequestParam("file") MultipartFile file) {
        try {
            // Validate input
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le fichier est requis"
                ));
            }

            // Validate extension
            String fileName = file.getOriginalFilename();
            if (fileName != null && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le fichier doit être au format Excel (.xlsx ou .xls)"
                ));
            }

            // Process import
            Map<String, Object> result = excelImportService.importStocksData(file);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Stocks importés avec succès",
                "resultat", result
            ));

        } catch (Exception e) {
            System.err.println("Erreur lors de l'importation des stocks: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de l'importation: " + e.getMessage()
            ));
        }
    }

}