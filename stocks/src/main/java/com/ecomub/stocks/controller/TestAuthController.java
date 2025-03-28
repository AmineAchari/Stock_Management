package com.ecomub.stocks.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestAuthController {

    @GetMapping("/public")
    public Map<String, Object> publicEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cet endpoint est accessible à tous");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            response.put("authenticated", true);
            response.put("username", auth.getName());
            response.put("authorities", auth.getAuthorities().toString());
        } else {
            response.put("authenticated", false);
        }
        
        return response;
    }

    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> authenticatedEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Endpoint accessible à tout utilisateur authentifié");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        response.put("username", auth.getName());
        response.put("authorities", auth.getAuthorities().toString());
        
        return response;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public Map<String, Object> adminEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Endpoint accessible uniquement aux ADMIN");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        response.put("username", auth.getName());
        response.put("authorities", auth.getAuthorities().toString());
        
        return response;
    }

    @GetMapping("/gestionnaire")
    @PreAuthorize("hasAuthority('GESTIONNAIRE_STOCK')")
    public Map<String, Object> gestionnaireEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Endpoint accessible uniquement aux GESTIONNAIRE_STOCK");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        response.put("username", auth.getName());
        response.put("authorities", auth.getAuthorities().toString());
        
        return response;
    }
} 