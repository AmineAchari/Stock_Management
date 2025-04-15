package com.ecomub.stocks.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

public interface ExcelImportService {
    Map<String, Object> importProduitsData(MultipartFile file) throws Exception;
    Map<String, Object> importLivraisonData(MultipartFile file, String paysSpecifie, 
        String villeSpecifiee, String dateSpecifiee) throws Exception;
    Map<String, Object> importStocksData(MultipartFile file) throws Exception;
}

