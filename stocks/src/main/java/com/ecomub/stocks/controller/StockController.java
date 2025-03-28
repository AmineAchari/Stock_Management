package com.ecomub.stocks.controller;


import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    // Mettre à jour un stock
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public Stock updateStock(@PathVariable Long id, @RequestBody Stock stockDetails) {
        return stockService.updateStock(id, stockDetails);
    }

    // Supprimer un stock
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public void deleteStock(@PathVariable Long id) {
        stockService.deleteStock(id);
    }
}
