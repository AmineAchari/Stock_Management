package com.ecomub.stocks.service;

import com.ecomub.stocks.model.Stock;
import com.ecomub.stocks.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StockService {

    @Autowired
    private StockRepository stockRepository;

    // Créer un stock
    public Stock createStock(Stock stock) {
        try {
            return stockRepository.save(stock);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Un stock avec le nom '" + stock.getNom() + "' existe déjà.");
        }
    }

    // Récupérer tous les stocks
    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }

    // Récupérer un stock par ID
    public Optional<Stock> getStockById(Long id) {
        return stockRepository.findById(id);
    }

    // Mettre à jour un stock
    public Stock updateStock(Long id, Stock stockDetails) {
        Optional<Stock> optionalStock = stockRepository.findById(id);
        if (optionalStock.isPresent()) {
            Stock stock = optionalStock.get();
            stock.setNom(stockDetails.getNom());
            stock.setAdresse(stockDetails.getAdresse());
            stock.setPays(stockDetails.getPays());
            stock.setVille(stockDetails.getVille());
            stock.setTypeStock(stockDetails.getTypeStock());
            try {
                return stockRepository.save(stock);
            } catch (DataIntegrityViolationException e) {
                throw new RuntimeException("Un stock avec le nom '" + stockDetails.getNom() + "' existe déjà.");
            }
        } else {
            throw new RuntimeException("Stock non trouvé avec l'ID : " + id);
        }
    }

    // Supprimer un stock
    public void deleteStock(Long id) {
        stockRepository.deleteById(id);
    }
}
