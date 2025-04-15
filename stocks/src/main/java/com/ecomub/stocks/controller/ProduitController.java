package com.ecomub.stocks.controller;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.service.ProduitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RequestMapping("/api/produits")
public class ProduitController {

    @Autowired
    private ProduitService produitService;

    // Créer un produit
    @PostMapping
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public Produit createProduit(@RequestBody Produit produit) {
        return produitService.createProduit(produit);
    }

    // Récupérer tous les produits
    @GetMapping
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public List<Produit> getAllProduits() {
        return produitService.getAllProduits();
    }

    // Récupérer un produit par ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public Optional<Produit> getProduitById(@PathVariable Long id) {
        return produitService.getProduitById(id);
    }

    // Mettre à jour un produit
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public Produit updateProduit(@PathVariable Long id, @RequestBody Produit produitDetails) {
        return produitService.updateProduit(id, produitDetails);
    }

    // Supprimer un produit
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public void deleteProduit(@PathVariable Long id) {
        produitService.deleteProduit(id);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<Map<String, Object>> importProduits(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
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
            Map<String, Object> result = produitService.importProduitsFromExcel(file);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Import réussi",
                "resultat", result
            ));

        } catch (Exception e) {
            System.err.println("Erreur import produits: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de l'importation: " + e.getMessage()
            ));
        }
    }
}
