package com.ecomub.stocks.service;

import com.ecomub.stocks.model.Produit;
import com.ecomub.stocks.repository.ProduitRepository;
import com.ecomub.stocks.repository.ProduitStockRepository;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class ProduitService {

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private ProduitStockRepository produitStockRepository;

    // Créer un produit
    public Produit createProduit(Produit produit) {
        try {
            return produitRepository.save(produit);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Un produit avec le nom '" + produit.getNom() + "' existe déjà.");
        }
    }

    // Récupérer tous les produits
    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    // Récupérer un produit par ID
    public Optional<Produit> getProduitById(Long id) {
        return produitRepository.findById(id);
    }

    // Mettre à jour un produit
    public Produit updateProduit(Long id, Produit produitDetails) {
        Optional<Produit> optionalProduit = produitRepository.findById(id);
        if (optionalProduit.isPresent()) {
            Produit produit = optionalProduit.get();
            produit.setNom(produitDetails.getNom());
            produit.setReference(produitDetails.getReference());
            produit.setDescription(produitDetails.getDescription());
            try {
                return produitRepository.save(produit);
            } catch (DataIntegrityViolationException e) {
                throw new RuntimeException("Un produit avec le nom '" + produitDetails.getNom() + "' existe déjà.");
            }
        } else {
            throw new RuntimeException("Produit non trouvé avec l'ID : " + id);
        }
    }

    @Transactional
    public void deleteProduit(Long id) {
        // Récupérer le produit
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'ID : " + id));
        
        // Supprimer d'abord toutes les associations produit-stock liées à ce produit
        produitStockRepository.deleteByProduitId(id);
        
        // Maintenant que toutes les associations sont supprimées, supprimer le produit
        produitRepository.delete(produit);
    }

    /**
     * Importer des produits depuis un fichier Excel
     *
     * @param file le fichier Excel contenant les données des produits
     * @return un Map contenant le résultat de l'importation
     */
    @Transactional
    public Map<String, Object> importProduitsFromExcel(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> produitsImportes = new ArrayList<>();
        int totalImportes = 0;
        int totalIgnores = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);

            if (!isValidHeader(headerRow)) {
                result.put("success", false);
                result.put("message", "Format du fichier incorrect. Format attendu: 'Produit ; Ref'");
                return result;
            }

            // Parcourir les lignes de données
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String nomProduit = getCellValueAsString(row.getCell(0)).trim();
                String reference = getCellValueAsString(row.getCell(1)).trim();

                if (nomProduit.isEmpty() || reference.isEmpty()) {
                    continue;
                }

                try {
                    int refNumerique = Integer.parseInt(reference);
                    
                    // Vérifier si le produit existe déjà (par nom ou référence)
                    boolean existsByName = produitRepository.findProduitByNom(nomProduit) != null;
                    boolean existsByRef = produitRepository.findProduitByReference(refNumerique) != null;

                    Map<String, Object> resultatLigne = new HashMap<>();
                    resultatLigne.put("nom", nomProduit);
                    resultatLigne.put("reference", reference);

                    if (existsByName) {
                        resultatLigne.put("status", "Ignoré - Nom de produit existant");
                        totalIgnores++;
                    } else if (existsByRef) {
                        resultatLigne.put("status", "Ignoré - Référence existante");
                        totalIgnores++;
                    } else {
                        // Créer un nouveau produit
                        Produit nouveauProduit = new Produit();
                        nouveauProduit.setNom(nomProduit);
                        nouveauProduit.setReference(refNumerique);
                        produitRepository.save(nouveauProduit);

                        resultatLigne.put("status", "Importé avec succès");
                        totalImportes++;
                    }

                    produitsImportes.add(resultatLigne);

                } catch (NumberFormatException e) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("nom", nomProduit);
                    error.put("reference", reference);
                    error.put("status", "Erreur: Référence invalide");
                    produitsImportes.add(error);
                    totalIgnores++;
                }
            }

            result.put("success", true);
            result.put("message", "Import terminé avec succès");
            result.put("produits", produitsImportes);
            result.put("totalImportes", totalImportes);
            result.put("totalIgnores", totalIgnores);

            return result;

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'importation: " + e.getMessage());
        }
    }

    private boolean isValidHeader(Row headerRow) {
        if (headerRow == null) return false;
        String firstHeader = getCellValueAsString(headerRow.getCell(0)).toLowerCase().trim();
        String secondHeader = getCellValueAsString(headerRow.getCell(1)).toLowerCase().trim();
        return firstHeader.contains("produit") && secondHeader.contains("ref");
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
}
