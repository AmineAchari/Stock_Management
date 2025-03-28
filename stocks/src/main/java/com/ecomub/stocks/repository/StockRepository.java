package com.ecomub.stocks.repository;

import com.ecomub.stocks.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockRepository extends JpaRepository<Stock, Long> {
}
