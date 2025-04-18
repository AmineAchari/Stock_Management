package com.ecomub.stocks.repository;

import com.ecomub.stocks.model.Produit;

import java.util.Optional;

import org.apache.commons.math3.stat.descriptive.summary.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Produit findProduitByNom(String nom);
    Produit findProduitByReference(Integer reference);


}
