package com.ecomub.stocks.repository;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProduitStockRepository extends JpaRepository<ProduitStock, Long> {
    ProduitStock findByProduitAndStock(Produit produit, Stock stock);
    List<ProduitStock> findByStockId(Long stockId);
}
