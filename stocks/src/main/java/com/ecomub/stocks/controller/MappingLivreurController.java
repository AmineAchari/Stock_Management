package com.ecomub.stocks.controller;

import com.ecomub.stocks.model.MappingLivreur;
import com.ecomub.stocks.service.MappingLivreurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/mapping-livreur")
@CrossOrigin(origins = "http://localhost:3000/", maxAge = 3600)
public class MappingLivreurController {

    @Autowired
    private MappingLivreurService mappingLivreurService;

    @GetMapping
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public List<MappingLivreur> getAllMappings() {
        return mappingLivreurService.getAllMappings();
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<MappingLivreur> getMappingById(@PathVariable Long id) {
        Optional<MappingLivreur> mapping = mappingLivreurService.getMappingById(id);
        if (mapping.isPresent()) {
            return ResponseEntity.ok(mapping.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public MappingLivreur createMapping(@RequestBody MappingLivreur mapping) {
        return mappingLivreurService.saveMapping(mapping);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<MappingLivreur> updateMapping(@PathVariable Long id, @RequestBody MappingLivreur mapping) {
        MappingLivreur updatedMapping = mappingLivreurService.updateMapping(id, mapping);
        if (updatedMapping != null) {
            return ResponseEntity.ok(updatedMapping);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<Map<String, Object>> deleteMapping(@PathVariable Long id) {
        boolean deleted = mappingLivreurService.deleteMapping(id);
        
        Map<String, Object> response = new HashMap<>();
        if (deleted) {
            response.put("success", true);
            response.put("message", "Mapping supprimé avec succès");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Mapping non trouvé");
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public MappingLivreur searchMapping(
            @RequestParam String nomLivreur,
            @RequestParam String prestataire,
            @RequestParam String ville) {
        return mappingLivreurService.getMapping(nomLivreur, prestataire, ville);
    }
    
    /**
     * Importe des mappings livreur-stock depuis un fichier Excel
     * Format attendu: colonnes Nom du Livreur, Prestataire, Ville, Type de Stock
     */
    @PostMapping("/import")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> importMappings(@RequestParam("file") MultipartFile file) {
        try {
            if (!file.getOriginalFilename().endsWith(".xlsx") && !file.getOriginalFilename().endsWith(".xls")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Veuillez télécharger un fichier Excel (.xlsx ou .xls)"
                ));
            }
            
            Map<String, Object> result = mappingLivreurService.importFromExcel(file);
            
            // Ajouter des informations supplémentaires à la réponse
            result.put("success", true);
            result.put("message", "Importation réussie: " + result.get("importes") + " mappings importés, " + 
                       result.get("ignores") + " mappings ignorés (déjà existants)");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de l'importation: " + e.getMessage()
            ));
        }
    }

    /**
     * Supprime les entrées en double dans la table mapping_livreur
     * @return Informations sur les entrées supprimées
     */
    @DeleteMapping("/supprimer-doublons")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public ResponseEntity<?> supprimerDoublons() {
        try {
            Map<String, Object> result = mappingLivreurService.supprimerDoublons();
            result.put("success", true);
            result.put("message", "Suppression des doublons effectuée avec succès");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de la suppression des doublons: " + e.getMessage()
            ));
        }
    }
} 