package com.ecomub.stocks.repository;

import com.ecomub.stocks.model.MappingLivreur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MappingLivreurRepository extends JpaRepository<MappingLivreur, Long> {
    Optional<MappingLivreur> findByNomLivreurAndPrestataireAndVille(String nomLivreur, String prestataire, String ville);
    Optional<MappingLivreur> findByNomLivreur(String nomLivreur);
} 