package com.ecomub.stocks.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class AccessDeniedHandlerImpl implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        System.out.println("=== ACCÈS REFUSÉ ===");
        System.out.println("URI demandée: " + request.getRequestURI());
        System.out.println("Méthode HTTP: " + request.getMethod());
        
        if (auth != null) {
            System.out.println("Utilisateur: " + auth.getName());
            System.out.println("Autorités: " + auth.getAuthorities());
        } else {
            System.out.println("Aucune authentification dans le contexte");
        }
        
        System.out.println("Message d'erreur: " + accessDeniedException.getMessage());
        System.out.println("=== FIN ACCÈS REFUSÉ ===");
        
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.getWriter().write("{\"error\":\"Accès refusé\",\"message\":\"Vous n'avez pas les autorisations nécessaires pour accéder à cette ressource.\"}");
    }
} 