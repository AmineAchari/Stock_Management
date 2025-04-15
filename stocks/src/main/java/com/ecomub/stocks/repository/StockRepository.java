package com.ecomub.stocks.repository;

import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.model.TypeStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByVilleAndTypeStock(String ville, TypeStock typeStock);
    List<Stock> findAllByVilleAndTypeStock(String ville, TypeStock typeStock);
    Optional<Stock> findByNom(String nom);
    Optional<Stock> findByPrestataireAndVilleAndTypeStock(String prestataire, String ville, TypeStock typeStock);
    Optional<Stock> findByNomAndVilleAndTypeStock(String nom, String ville, TypeStock typeStock);
}
