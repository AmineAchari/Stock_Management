package com.ecomub.stocks.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mapping_livreur")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MappingLivreur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Nom complet du livreur ou une partie significative
    private String nomLivreur;
    
    // Nom du prestataire associé (ex : Ecomub, LMT, etc.)
    private String prestataire;

    private String pays;

    // Ville associée à ce mapping
    private String ville;
    
    // Type de stock déduit
    @Enumerated(EnumType.STRING)
    private TypeStock typeStock;
} 