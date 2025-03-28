package com.ecomub.stocks.service;


import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.repository.ProduitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProduitService {

    @Autowired
    private ProduitRepository produitRepository;

    // Créer un produit
    public Produit createProduit(Produit produit) {
        try {
            return produitRepository.save(produit);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Un produit avec le nom '" + produit.getNom() + "' existe déjà.");
        }
    }

    // Récupérer tous les produits
    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    // Récupérer un produit par ID
    public Optional<Produit> getProduitById(Long id) {
        return produitRepository.findById(id);
    }

    // Mettre à jour un produit
    public Produit updateProduit(Long id, Produit produitDetails) {
        Optional<Produit> optionalProduit = produitRepository.findById(id);
        if (optionalProduit.isPresent()) {
            Produit produit = optionalProduit.get();
            produit.setNom(produitDetails.getNom());
            produit.setReference(produitDetails.getReference());
            produit.setDescription(produitDetails.getDescription());
            try {
                return produitRepository.save(produit);
            } catch (DataIntegrityViolationException e) {
                throw new RuntimeException("Un produit avec le nom '" + produitDetails.getNom() + "' existe déjà.");
            }
        } else {
            throw new RuntimeException("Produit non trouvé avec l'ID : " + id);
        }
    }

    // Supprimer un produit
    public void deleteProduit(Long id) {
        produitRepository.deleteById(id);
    }
}
