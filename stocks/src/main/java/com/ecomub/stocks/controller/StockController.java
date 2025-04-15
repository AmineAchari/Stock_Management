package com.ecomub.stocks.controller;


import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "http://localhost:3000/", maxAge = 3600)
public class StockController {

    @Autowired
    private StockService stockService;

    // Créer un stock
    @PostMapping
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public Stock createStock(@RequestBody Stock stock) {
        return stockService.createStock(stock);
    }

    // Récupérer tous les stocks
    @GetMapping
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public List<Stock> getAllStocks() {
        return stockService.getAllStocks();
    }

    // Récupérer un stock par ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public Optional<Stock> getStockById(@PathVariable Long id) {
        return stockService.getStockById(id);
    }
    
    // Récupérer les stocks groupés par pays
    @GetMapping("/by-country")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<Map<String, List<Stock>>> getStocksByCountry() {
        try {
            Map<String, List<Stock>> stocksByCountry = stockService.getStocksByCountry();
            return ResponseEntity.ok(stocksByCountry);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Mettre à jour un stock
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public Stock updateStock(@PathVariable Long id, @RequestBody Stock stockDetails) {
        return stockService.updateStock(id, stockDetails);
    }

    // Supprimer un stock
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> deleteStock(@PathVariable Long id) {
        try {
            stockService.deleteStock(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Stock supprimé avec succès"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // Corriger les pays des stocks
    @PostMapping("/correct-countries")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> correctStockCountries() {
        try {
            int updatedCount = stockService.correctStockCountries();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", updatedCount + " stocks ont été mis à jour avec succès",
                "updatedCount", updatedCount
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de la correction des pays: " + e.getMessage()
            ));
        }
    }

    // Exporter les détails d'un stock
    @GetMapping("/export/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<Resource> exportStockDetails(@PathVariable Long id) {
        try {
            ByteArrayInputStream excel = stockService.exportStockDetails(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=stock_details.xlsx");
            
            return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.ms-excel"))
                .body(new InputStreamResource(excel));
                
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
