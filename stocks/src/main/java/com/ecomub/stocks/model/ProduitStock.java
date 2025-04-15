package com.ecomub.stocks.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Table(name = "produit_stock")
public class ProduitStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne
    @JoinColumn(name = "centre_stock_id", nullable = false)
    private Stock stock;

    private Integer quantite;
}
