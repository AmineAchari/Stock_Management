package com.ecomub.stocks.service;

import com.ecomub.stocks.model.MappingLivreur;
import com.ecomub.stocks.model.TypeStock;
import com.ecomub.stocks.repository.MappingLivreurRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.ArrayList;

@Service
public class MappingLivreurService {

    @Autowired
    private MappingLivreurRepository mappingLivreurRepository;

    public MappingLivreur getMapping(String nomLivreur, String prestataire, String ville) {
        Optional<MappingLivreur> mappingOpt = mappingLivreurRepository
                .findByNomLivreurAndPrestataireAndVille(nomLivreur, prestataire, ville);
        return mappingOpt.orElse(null);
    }
    
    public Optional<MappingLivreur> getMappingById(Long id) {
        return mappingLivreurRepository.findById(id);
    }

    public MappingLivreur saveMapping(MappingLivreur mapping) {
        return mappingLivreurRepository.save(mapping);
    }
    
    public MappingLivreur updateMapping(Long id, MappingLivreur mappingDetails) {
        Optional<MappingLivreur> mappingOpt = mappingLivreurRepository.findById(id);
        
        if (mappingOpt.isPresent()) {
            MappingLivreur existingMapping = mappingOpt.get();
            existingMapping.setNomLivreur(mappingDetails.getNomLivreur());
            existingMapping.setPrestataire(mappingDetails.getPrestataire());
            existingMapping.setVille(mappingDetails.getVille());
            existingMapping.setTypeStock(mappingDetails.getTypeStock());
            
            return mappingLivreurRepository.save(existingMapping);
        }
        
        return null; // Mapping non trouvé
    }
    
    public boolean deleteMapping(Long id) {
        if (mappingLivreurRepository.existsById(id)) {
            mappingLivreurRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public List<MappingLivreur> getAllMappings() {
        return mappingLivreurRepository.findAll();
    }
    
    /**
     * Importe des mappings livreur-stock depuis un fichier Excel
     * @param file Le fichier Excel contenant les mappings
     * @return Le nombre de mappings importés
     */
    public Map<String, Object> importFromExcel(MultipartFile file) {
        try {
            Workbook workbook = WorkbookFactory.create(file.getInputStream());
            Sheet sheet = workbook.getSheetAt(0);
            
            int importCount = 0;
            int ignoredCount = 0;
            List<String> ignoredLivreurs = new ArrayList<>();
            
            for (Row row : sheet) {
                // Ignorer la première ligne (en-têtes)
                if (row.getRowNum() == 0) continue;
                
                // Extraire les données de chaque colonne
                String nomLivreur = getCellValueAsString(row.getCell(0));
                String prestataire = getCellValueAsString(row.getCell(1));
                String ville = getCellValueAsString(row.getCell(2));
                String typeStock = getCellValueAsString(row.getCell(3));
                
                // Ignorer les lignes vides
                if (nomLivreur.isEmpty()) continue;
                
                // Vérifier si ce livreur existe déjà
                boolean exists = mappingLivreurRepository.findByNomLivreur(nomLivreur).isPresent();
                
                if (exists) {
                    // Ignorer ce mapping et continuer avec le suivant
                    ignoredCount++;
                    ignoredLivreurs.add(nomLivreur);
                    continue;
                }
                
                // Créer un nouveau mapping
                MappingLivreur mapping = new MappingLivreur();
                mapping.setNomLivreur(nomLivreur);
                mapping.setPrestataire(prestataire);
                mapping.setVille(ville);
                
                // Convertir le type de stock en enum
                try {
                    TypeStock typeStockEnum = TypeStock.valueOf(typeStock.toUpperCase());
                    mapping.setTypeStock(typeStockEnum);
                } catch (IllegalArgumentException e) {
                    // Type de stock invalide, utiliser PRESTATAIRE par défaut
                    mapping.setTypeStock(TypeStock.PRESTATAIRE);
                }
                
                mappingLivreurRepository.save(mapping);
                importCount++;
            }
            
            workbook.close();
            
            Map<String, Object> result = new HashMap<>();
            result.put("importes", importCount);
            result.put("ignores", ignoredCount);
            result.put("livreursIgnores", ignoredLivreurs);
            return result;
            
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier Excel: " + e.getMessage());
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((int) cell.getNumericCellValue());
            default:
                return "";
        }
    }

    /**
     * Supprime les entrées en double dans la table mapping_livreur
     * @return Map contenant le nombre d'entrées supprimées et les noms des livreurs concernés
     */
    public Map<String, Object> supprimerDoublons() {
        List<MappingLivreur> allMappings = getAllMappings();
        Map<String, MappingLivreur> uniqueMappings = new HashMap<>();
        List<MappingLivreur> duplicates = new ArrayList<>();
        List<String> livreursDupliques = new ArrayList<>();
        
        // Identifier les doublons
        for (MappingLivreur mapping : allMappings) {
            String nomLivreur = mapping.getNomLivreur();
            if (uniqueMappings.containsKey(nomLivreur)) {
                duplicates.add(mapping);
                livreursDupliques.add(nomLivreur);
            } else {
                uniqueMappings.put(nomLivreur, mapping);
            }
        }
        
        // Supprimer les doublons
        for (MappingLivreur duplicate : duplicates) {
            mappingLivreurRepository.delete(duplicate);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("nombreSupprime", duplicates.size());
        result.put("livreursSupprime", livreursDupliques);
        
        return result;
    }
} 