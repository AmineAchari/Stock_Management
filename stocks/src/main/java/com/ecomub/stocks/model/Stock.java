package com.ecomub.stocks.model;


import jakarta.persistence.*;
import lombok.*;

@Data
@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "Stocks")
public class Stock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String nom;
    private String adresse;
    private String pays;
    private String ville;

    @Enumerated(EnumType.STRING)
    private TypeStock typeStock;
}
