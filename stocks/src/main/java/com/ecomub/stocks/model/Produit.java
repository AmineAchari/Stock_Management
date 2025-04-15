package com.ecomub.stocks.model;


import jakarta.persistence.*;
import lombok.*;


@Data
@Entity
@Table(name = "produits", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"nom"}, name = "uk_produit_nom"),
    @UniqueConstraint(columnNames = {"reference"}, name = "uk_produit_reference")
})
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private Integer reference;

    private String description;

    @Column(name = "seuil_alerte", nullable = false)
    private Integer seuilAlerte = 30; // Default threshold value

    // Validation methods
    public void validateBeforeSave() {
        if (nom == null || nom.trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom du produit ne peut pas être vide");
        }
        if (reference == null) {
            throw new IllegalArgumentException("La référence du produit ne peut pas être nulle");
        }
        if (seuilAlerte == null) {
            seuilAlerte = 30; // Set default if null
        }
    }
}
