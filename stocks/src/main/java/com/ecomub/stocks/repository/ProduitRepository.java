package com.ecomub.stocks.repository;

import com.ecomub.stocks.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Produit findProduitByNom(String nom);
}
