package com.ecomub.stocks.controller;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.service.ProduitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:3000/", maxAge = 3600)
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
}
