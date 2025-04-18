package com.ecomub.stocks.service;

import com.ecomub.stocks.model.MappingLivreur;
import com.ecomub.stocks.model.TypeStock; // Assurez-vous que cet import est présent
import com.ecomub.stocks.repository.MappingLivreurRepository;
import org.apache.poi.ss.usermodel.*; // Import générique pour POI
import org.apache.poi.xssf.usermodel.XSSFWorkbook; // Ou HSSFWorkbook si .xls
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional; // Ajouté pour la cohérence

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Objects; // Pour Objects.requireNonNullElse

@Service
public class MappingLivreurService {

    @Autowired
    private MappingLivreurRepository mappingLivreurRepository;

    /**
     * Recherche un mapping par nom de livreur, prestataire et ville.
     *
     * @param nomLivreur   Le nom du livreur.
     * @param prestataire Le nom du prestataire.
     * @param ville        La ville.
     * @return Le MappingLivreur trouvé ou null si aucun n'est trouvé.
     */
    public MappingLivreur getMapping(String nomLivreur, String prestataire, String ville) {
        // Note: Cette méthode recherche par 3 critères, mais l'import actuel vérifie l'unicité par nomLivreur seulement.
        // Adaptez si nécessaire.
        Optional<MappingLivreur> mappingOpt = mappingLivreurRepository
                .findByNomLivreurAndPrestataireAndVille(nomLivreur, prestataire, ville);
        return mappingOpt.orElse(null);
    }

    /**
     * Récupère un mapping par son ID.
     *
     * @param id L'ID du mapping.
     * @return Un Optional contenant le mapping s'il est trouvé.
     */
    public Optional<MappingLivreur> getMappingById(Long id) {
        return mappingLivreurRepository.findById(id);
    }

    /**
     * Sauvegarde un nouveau mapping. Vérifie l'unicité par nom de livreur avant la sauvegarde.
     *
     * @param mapping Le mapping à sauvegarder.
     * @return Le mapping sauvegardé.
     * @throws RuntimeException si un mapping avec le même nom de livreur existe déjà.
     */
    @Transactional // Bonne pratique d'ajouter @Transactional
    public MappingLivreur saveMapping(MappingLivreur mapping) {
        // Ajouter une vérification d'unicité avant de sauvegarder si nécessaire
        // Par exemple, vérifier si un mapping avec le même nomLivreur existe déjà
        Optional<MappingLivreur> existing = mappingLivreurRepository.findByNomLivreur(mapping.getNomLivreur());
        if (existing.isPresent()) {
            throw new RuntimeException("Un mapping pour le livreur '" + mapping.getNomLivreur() + "' existe déjà.");
        }
        // Assurez-vous que le champ pays existe dans l'entité MappingLivreur
        // mapping.setPays(mapping.getPays()); // Si nécessaire d'initialiser ou valider
        return mappingLivreurRepository.save(mapping);
    }

    /**
     * Met à jour un mapping existant.
     *
     * @param id             L'ID du mapping à mettre à jour.
     * @param mappingDetails Les nouvelles informations du mapping.
     * @return Le mapping mis à jour.
     * @throws RuntimeException si le mapping n'est pas trouvé ou si le nouveau nom de livreur est déjà utilisé.
     */
    @Transactional // Bonne pratique d'ajouter @Transactional
    public MappingLivreur updateMapping(Long id, MappingLivreur mappingDetails) {
        MappingLivreur existingMapping = mappingLivreurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mapping non trouvé avec l'ID : " + id));

        // Vérifier si le nouveau nom de livreur est déjà utilisé par un autre mapping
        if (!existingMapping.getNomLivreur().equalsIgnoreCase(mappingDetails.getNomLivreur())) {
            Optional<MappingLivreur> conflict = mappingLivreurRepository.findByNomLivreur(mappingDetails.getNomLivreur());
            if (conflict.isPresent()) {
                 throw new RuntimeException("Le nom de livreur '" + mappingDetails.getNomLivreur() + "' est déjà utilisé par un autre mapping.");
            }
        }

        existingMapping.setNomLivreur(mappingDetails.getNomLivreur());
        existingMapping.setPrestataire(mappingDetails.getPrestataire());
        existingMapping.setVille(mappingDetails.getVille());
        existingMapping.setPays(mappingDetails.getPays()); // Assurez-vous que le champ pays existe dans MappingLivreur
        existingMapping.setTypeStock(mappingDetails.getTypeStock());

        return mappingLivreurRepository.save(existingMapping);
    }

    /**
     * Supprime un mapping par son ID.
     *
     * @param id L'ID du mapping à supprimer.
     * @return true si la suppression a réussi, false sinon.
     */
    @Transactional // Bonne pratique d'ajouter @Transactional
    public boolean deleteMapping(Long id) {
        if (mappingLivreurRepository.existsById(id)) {
            mappingLivreurRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Récupère tous les mappings.
     *
     * @return La liste de tous les mappings.
     */
    public List<MappingLivreur> getAllMappings() {
        return mappingLivreurRepository.findAll();
    }

    /**
     * Importe des mappings livreur-stock depuis un fichier Excel.
     * Colonnes attendues : livreurs (0), prestataire (1), Pays (2), ville (3)
     * @param file Le fichier Excel contenant les mappings
     * @return Un Map contenant les résultats de l'importation
     */
    @Transactional // Bonne pratique d'ajouter @Transactional pour les opérations d'écriture multiples
    public Map<String, Object> importFromExcel(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> importedMappingsDetails = new ArrayList<>();
        int importCount = 0;
        int ignoredCount = 0;
        List<String> errors = new ArrayList<>();

        // Vérification initiale du fichier (peut être faite dans le contrôleur aussi)
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier ne peut pas être vide.");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || (!originalFilename.endsWith(".xlsx") && !originalFilename.endsWith(".xls"))) {
             throw new IllegalArgumentException("Format de fichier invalide. Seuls les fichiers .xlsx et .xls sont acceptés.");
        }


        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Optionnel: Vérifier les en-têtes si nécessaire
            // Row headerRow = sheet.getRow(0);
            // if (!isValidHeader(headerRow)) {
            //     throw new IllegalArgumentException("En-têtes de fichier invalides. Attendu: livreurs, prestataire, Pays, ville");
            // }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) { // Commence à 1 pour sauter l'en-tête
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue; // Ignorer les lignes complètement vides
                }

                // Extraire les données des colonnes attendues
                String nomLivreur = getCellValueAsString(row.getCell(0)).trim();
                String prestataire = getCellValueAsString(row.getCell(1)).trim();
                String pays = getCellValueAsString(row.getCell(2)).trim(); // Lecture de la colonne Pays
                String ville = getCellValueAsString(row.getCell(3)).trim(); // Lecture de la colonne Ville

                Map<String, Object> mappingDetail = new HashMap<>();
                mappingDetail.put("ligne", i + 1); // Numéro de ligne dans Excel
                mappingDetail.put("livreur", nomLivreur);
                mappingDetail.put("prestataire", prestataire);
                mappingDetail.put("pays", pays);
                mappingDetail.put("ville", ville);


                // Ignorer les lignes si des données essentielles sont manquantes
                if (nomLivreur.isEmpty() || prestataire.isEmpty() || pays.isEmpty() || ville.isEmpty()) {
                    mappingDetail.put("statut", "Ignoré - Données manquantes (livreur, prestataire, pays ou ville)");
                    ignoredCount++;
                    importedMappingsDetails.add(mappingDetail);
                    continue;
                }

                // Vérifier si un mapping pour ce livreur existe déjà (logique actuelle)
                // Alternative: vérifier la combinaison unique nomLivreur+prestataire+pays+ville
                boolean exists = mappingLivreurRepository.findByNomLivreur(nomLivreur).isPresent();

                if (exists) {
                    // Ignorer ce mapping car le livreur existe déjà
                    mappingDetail.put("statut", "Ignoré - Livreur déjà mappé");
                    ignoredCount++;
                    importedMappingsDetails.add(mappingDetail);
                    continue;
                }

                try {
                    // Créer un nouveau mapping
                    MappingLivreur mapping = new MappingLivreur();
                    mapping.setNomLivreur(nomLivreur);
                    mapping.setPrestataire(prestataire);
                    mapping.setPays(pays); // Assigner le pays lu (Assurez-vous que le champ existe dans MappingLivreur)
                    mapping.setVille(ville);
                    mapping.setTypeStock(TypeStock.PRESTATAIRE); // Définir une valeur par défaut car non présente dans le fichier

                    mappingLivreurRepository.save(mapping);
                    mappingDetail.put("statut", "Importé");
                    importCount++;
                    importedMappingsDetails.add(mappingDetail);

                } catch (Exception e) {
                    // Gérer les erreurs potentielles lors de la sauvegarde (ex: contrainte de base de données)
                    mappingDetail.put("statut", "Erreur - " + e.getMessage());
                    errors.add("Ligne " + (i + 1) + ": Erreur lors de la sauvegarde - " + e.getMessage());
                    ignoredCount++;
                    importedMappingsDetails.add(mappingDetail);
                }
            }

        } catch (IOException e) {
            // Erreur de lecture du fichier
            throw new RuntimeException("Erreur lors de la lecture du fichier Excel: " + e.getMessage());
        } catch (Exception e) {
            // Autres erreurs potentielles (ex: format de fichier incorrect, erreur POI)
             throw new RuntimeException("Erreur lors du traitement du fichier: " + e.getMessage());
        }

        result.put("totalLignesTraitees", importCount + ignoredCount);
        result.put("importes", importCount);
        result.put("ignores", ignoredCount);
        result.put("details", importedMappingsDetails); // Liste détaillée des résultats par ligne
        result.put("erreurs", errors); // Liste des erreurs spécifiques

        return result;
    }

    /**
     * Récupère la valeur d'une cellule sous forme de chaîne de caractères.
     * Gère les types String, Numeric (entiers et décimaux), Boolean et Blank.
     * Évalue les formules si possible.
     *
     * @param cell La cellule à lire
     * @return La valeur de la cellule en tant que String, ou une chaîne vide si la cellule est null ou non supportée.
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }

        DataFormatter formatter = new DataFormatter(); // Utiliser DataFormatter pour une meilleure gestion des types

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                // Utiliser DataFormatter pour gérer les formats numériques (y compris les dates si formatées comme telles)
                return formatter.formatCellValue(cell).trim();
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                // Tenter d'évaluer la formule et de la formater
                try {
                     return formatter.formatCellValue(cell, cell.getCachedFormulaResultType() == CellType.NUMERIC ? null : new FormulaEvaluator() {
                        // Implémentation basique, peut nécessiter une instance réelle du workbook
                        @Override public void clearAllCachedResultValues() {}
                        @Override public void notifySetFormula(Cell cell) {}
                        @Override public void notifyDeleteCell(Cell cell) {}
                        @Override public void notifyUpdateCell(Cell cell) {}
                        @Override public CellValue evaluate(Cell cell) { return null; } // À implémenter si nécessaire
                        @Override public Cell evaluateInCell(Cell cell) { return null; } // À implémenter si nécessaire
                        @Override public void setupReferencedWorkbooks(Map<String, FormulaEvaluator> workbooks) {}
                        @Override public void setDebugEvaluationOutputForNextEval(boolean value) {}
                        @Override public void setIgnoreMissingWorkbooks(boolean ignore) {}
                        @Override public void evaluateAll() {}
                        @Override public CellType evaluateFormulaCell(Cell cell) { return cell.getCachedFormulaResultType(); }
                        // @Deprecated @Override public CellType evaluateFormulaCellEnum(Cell cell) { return evaluateFormulaCell(cell); }
                    }).trim();
                } catch (Exception e) {
                    System.err.println("Impossible d'évaluer ou formater la formule dans la cellule: " + cell.getAddress() + " - Erreur: " + e.getMessage());
                    // Essayer de récupérer la valeur mise en cache si l'évaluation échoue
                    try {
                        return cell.getStringCellValue().trim(); // Ou getNumericCellValue, etc. selon le type attendu
                    } catch (Exception ex) {
                        return "#ERREUR_FORMULE#"; // Indication d'erreur
                    }
                }
            case BLANK: // Gérer explicitement les cellules vides
                return "";
            default:
                return "";
        }
    }


    /**
     * Supprime les entrées en double dans la table mapping_livreur en se basant sur nomLivreur.
     * @return Map contenant le nombre d'entrées supprimées et les noms des livreurs concernés
     */
    @Transactional // Assurer la transaction pour la suppression
    public Map<String, Object> supprimerDoublons() {
        List<MappingLivreur> allMappings = getAllMappings();
        Map<String, MappingLivreur> uniqueMappings = new HashMap<>();
        List<MappingLivreur> duplicatesToDelete = new ArrayList<>();
        List<String> livreursDupliques = new ArrayList<>();

        // Identifier les doublons (garde la première occurrence, supprime les suivantes)
        for (MappingLivreur mapping : allMappings) {
            String nomLivreur = mapping.getNomLivreur();
            // Utiliser Objects.requireNonNullElse pour éviter NPE si nomLivreur est null
            // Utiliser une clé insensible à la casse pour la comparaison
            String key = Objects.requireNonNullElse(nomLivreur, "").trim().toLowerCase();

            if (!key.isEmpty()) { // Ne pas traiter les clés vides
                if (uniqueMappings.containsKey(key)) {
                    duplicatesToDelete.add(mapping); // Ajouter le doublon à la liste de suppression
                    if (!livreursDupliques.contains(nomLivreur)) { // Ajouter le nom seulement une fois pour le rapport
                         livreursDupliques.add(nomLivreur);
                    }
                } else {
                    uniqueMappings.put(key, mapping); // Garder la première occurrence
                }
            } else {
                // Optionnel: Gérer les mappings avec nomLivreur vide/null si nécessaire
                System.out.println("Mapping ignoré pour la suppression des doublons (nomLivreur vide): ID " + mapping.getId());
            }
        }

        // Supprimer les doublons identifiés
        if (!duplicatesToDelete.isEmpty()) {
            mappingLivreurRepository.deleteAll(duplicatesToDelete);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("nombreSupprime", duplicatesToDelete.size());
        result.put("livreursSupprimes", livreursDupliques); // Noms des livreurs dont les doublons ont été supprimés

        return result;
    }

    // Optionnel: Méthode pour valider les en-têtes (à adapter si besoin)
    /*
    private boolean isValidHeader(Row headerRow) {
        if (headerRow == null) return false;
        // Vérifier si les cellules 0, 1, 2, 3 contiennent les bons textes (insensible à la casse)
        return getCellValueAsString(headerRow.getCell(0)).equalsIgnoreCase("livreurs") &&
               getCellValueAsString(headerRow.getCell(1)).equalsIgnoreCase("prestataire") &&
               getCellValueAsString(headerRow.getCell(2)).equalsIgnoreCase("Pays") &&
               getCellValueAsString(headerRow.getCell(3)).equalsIgnoreCase("ville");
    }
    */
}
