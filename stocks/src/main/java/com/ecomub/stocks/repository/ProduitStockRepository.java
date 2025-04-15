package com.ecomub.stocks.repository;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.model.ProduitStock;
import com.ecomub.stocks.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProduitStockRepository extends JpaRepository<ProduitStock, Long> {
    ProduitStock findByProduitAndStock(Produit produit, Stock stock);
    List<ProduitStock> findByStockId(Long stockId);
    List<ProduitStock> findByProduitId(Long produitId);
    Optional<ProduitStock> findByStock_IdAndProduit_Id(Long stockId, Long produitId);
    List<ProduitStock> findByStock_Id(Long stockId);
    List<ProduitStock> findByStock(Stock stock);
    
    @Transactional
    void deleteByStockId(Long stockId);
    
    @Transactional
    void deleteByProduitId(Long produitId);

}
