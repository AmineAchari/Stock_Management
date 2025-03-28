package com.ecomub.stocks.service;


import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.repository.ProduitRepository;
import com.ecomub.stocks.repository.ProduitStockRepository;
import com.ecomub.stocks.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProduitStockService {

    @Autowired
    private ProduitStockRepository produitStockRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private StockRepository stockRepository;

    // Affecter un produit à un stock avec une quantité
    public ProduitStock affecterProduitAuStock(Long produitId, Long stockId, int quantite) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'ID : " + produitId));
        Stock stock = stockRepository.findById(stockId)
                .orElseThrow(() -> new RuntimeException("Stock non trouvé avec l'ID : " + stockId));

        ProduitStock produitStock = produitStockRepository.findByProduitAndStock(produit, stock);
        if (produitStock == null) {
            // Nouvelle affectation
            produitStock = new ProduitStock();
            produitStock.setProduit(produit);
            produitStock.setStock(stock);
            produitStock.setQuantite(quantite);
        } else {
            // Affectation existante - incrémenter la quantité
            int nouvelleQuantite = produitStock.getQuantite() + quantite;
            produitStock.setQuantite(nouvelleQuantite);
        }
        
        return produitStockRepository.save(produitStock);
    }

    public ProduitStock modifierQuantite(Long produitId, Long stockId, int nouvelleQuantite) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'ID : " + produitId));
        Stock stock = stockRepository.findById(stockId)
                .orElseThrow(() -> new RuntimeException("Stock non trouvé avec l'ID : " + stockId));

        ProduitStock produitStock = produitStockRepository.findByProduitAndStock(produit, stock);
        if (produitStock == null) {
            throw new RuntimeException("Aucune affectation trouvée pour ce produit dans ce stock");
        }

        produitStock.setQuantite(nouvelleQuantite);
        return produitStockRepository.save(produitStock);
    }

    public List<ProduitStock> getProduitsByStock(Long stockId) {
        return produitStockRepository.findByStockId(stockId);
    }
}

