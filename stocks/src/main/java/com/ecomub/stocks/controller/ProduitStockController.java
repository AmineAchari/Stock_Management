package com.ecomub.stocks.controller;


import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.service.ProduitStockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/produit-stock")
@CrossOrigin(origins = "http://localhost:3000/", maxAge = 3600)
public class ProduitStockController {

    @Autowired
    private ProduitStockService produitStockService;

    // Affecter un produit à un stock avec une quantité
    @PostMapping("/affecter")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> affecterProduitAuStock(
            @RequestParam Long produitId,
            @RequestParam Long stockId,
            @RequestParam int quantite) {
        try {
            // Vérifier si l'association existe déjà
            Optional<ProduitStock> existingAssociation = produitStockService.findByStockAndProduit(stockId, produitId);
            
            if (existingAssociation.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Ce produit est déjà affecté à ce stock"
                ));
            }

            // Si pas d'association existante, procéder à l'affectation
            ProduitStock produitStock = produitStockService.affecterProduitAuStock(produitId, stockId, quantite);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Produit affecté avec succès",
                "data", produitStock
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
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
            @RequestParam("modification") int quantite) {
        try {
            ProduitStock produitStock = produitStockService.modifierQuantite(produitId, stockId, quantite);
            return ResponseEntity.ok(produitStock);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", e.getMessage(),
                "success", false
            ));
        }
    }
    
    // Générer un rapport des produits par pays
    @GetMapping("/rapport-par-pays")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> genererRapportParPays() {
        try {
            Map<String, Object> rapport = produitStockService.genererRapportParPays();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Rapport généré avec succès",
                "rapport", rapport
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de la génération du rapport: " + e.getMessage()
            ));
        }
    }
    
    // Récupérer les produits à stock faible (en-dessous du seuil)
    @GetMapping("/stock-faible")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> getProduitsBelowThreshold(@RequestParam(defaultValue = "10") int seuil) {
        try {
            Map<String, Object> produitsBelowThreshold = produitStockService.getProduitsBelowThreshold(seuil);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Liste des produits à stock faible générée",
                "produits", produitsBelowThreshold
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de la génération de la liste: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> getStockStatistics() {
        try {
            Map<String, Object> stats = produitStockService.getStockStatistics();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "statistics", stats
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors du calcul des statistiques: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/annuler-affectation")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> annulerAffectation(
            @RequestParam Long produitId,
            @RequestParam Long stockId) {
        try {
            produitStockService.annulerAffectation(produitId, stockId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Affectation annulée avec succès"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
