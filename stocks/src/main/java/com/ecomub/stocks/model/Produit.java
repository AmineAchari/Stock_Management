package com.ecomub.stocks.model;


import jakarta.persistence.*;
import lombok.*;


@Data
@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "produits")
public class Produit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String nom;
    private String reference;
    private String description;
    //private String batches;
}
