package com.ecomub.stocks.controller;


import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.service.ProduitStockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/produit-stock")
@CrossOrigin(origins = "http://localhost:3000/", maxAge = 3600)
public class ProduitStockController {

    @Autowired
    private ProduitStockService produitStockService;

    // Affecter un produit à un stock avec une quantité
    @PostMapping("/affecter")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ProduitStock affecterProduitAuStock(
            @RequestParam Long produitId,
            @RequestParam Long stockId,
            @RequestParam int quantite) {
        return produitStockService.affecterProduitAuStock(produitId, stockId, quantite);
    }

    @GetMapping("/stock/{stockId}/produits")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public List<ProduitStock> getProduitsByStock(@PathVariable Long stockId) {
        return produitStockService.getProduitsByStock(stockId);
    }
    
    // Modifier la quantité d'un produit dans un stock
    @PutMapping("/modifier-quantite")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> modifierQuantite(
            @RequestParam Long produitId,
            @RequestParam Long stockId,
            @RequestParam int nouvelleQuantite) {
        try {
            ProduitStock produitStock = produitStockService.modifierQuantite(produitId, stockId, nouvelleQuantite);
            return ResponseEntity.ok(produitStock);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", e.getMessage(),
                "success", false
            ));
        }
    }
}
