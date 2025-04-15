package com.ecomub.stocks.controller;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.service.ProduitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/import")
public class ImportDataController {

    @Autowired
    private ProduitService produitService;

    @PostMapping("/produits-demo")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> importProduits() {
        List<Produit> produits = new ArrayList<>();
        
        produits.add(createProduit(2L, "desc99", "stud", "sd5"));
        produits.add(createProduit(3L, "desc2", "lavaslime", "ac88"));
        produits.add(createProduit(7L, "exemple", "test1", "4546465"));
        produits.add(createProduit(9L, "tyuryu", "viramax1", "4546465"));
        produits.add(createProduit(10L, "desc", "ALPROSTADIL NUTRAFRIK", "4546465"));
        produits.add(createProduit(11L, "", "Anti-Verrues", "54545454"));
        produits.add(createProduit(12L, "", "Eye Repair", "88888888888888"));
        produits.add(createProduit(13L, "", "LAVASLIM NUTRAFRIK", "33333333333333"));
        produits.add(createProduit(14L, "", "South Moon", "555555555555"));
        produits.add(createProduit(15L, "", "spray raoul", "33333333378"));
        
        List<String> resultats = new ArrayList<>();
        int success = 0;
        int errors = 0;
        
        for (Produit produit : produits) {
            try {
                produitService.createProduit(produit);
                resultats.add("Produit '" + produit.getNom() + "' ajouté avec succès");
                success++;
            } catch (Exception e) {
                resultats.add("Erreur lors de l'ajout de '" + produit.getNom() + "': " + e.getMessage());
                errors++;
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", errors == 0);
        response.put("total", produits.size());
        response.put("reussis", success);
        response.put("echecs", errors);
        response.put("resultats", resultats);
        
        return ResponseEntity.ok(response);
    }
    
    private Produit createProduit(Long id, String description, String nom, String reference) {
        Produit produit = new Produit();
        produit.setId(id);
        produit.setDescription(description);
        produit.setNom(nom);
        produit.setReference(Integer.valueOf(reference));
        return produit;
    }
} 