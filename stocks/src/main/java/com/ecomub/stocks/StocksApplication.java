package com.ecomub.stocks;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.ecomub.stocks")
@EntityScan(basePackages = "com.ecomub.stocks.model")
@EnableJpaRepositories(basePackages = "com.ecomub.stocks.repository")
public class StocksApplication {
    public static void main(String[] args) {
        SpringApplication.run(StocksApplication.class, args);
    }
}
