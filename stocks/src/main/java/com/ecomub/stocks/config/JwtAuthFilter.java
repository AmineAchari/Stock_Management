package com.ecomub.stocks.config;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.stream.Collectors;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtTokenUtil;

    @Autowired
    @Qualifier("userService")
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        final String requestURI = request.getRequestURI();
        final String method = request.getMethod();
        
        // Log détaillé pour le débogage
        System.out.println("=== FILTRAGE JWT ===");
        System.out.println("Méthode HTTP: " + method);
        System.out.println("URI demandée: " + requestURI);
        
        // Ne pas appliquer le filtre pour les endpoints d'authentification
        if (requestURI.contains("/api/auth/")) {
            System.out.println("Endpoint d'auth détecté, filtrage ignoré");
            chain.doFilter(request, response);
            return;
        }
        
        final String requestTokenHeader = request.getHeader("Authorization");
        System.out.println("Token Header: " + (requestTokenHeader != null ? requestTokenHeader : "absent"));
        
        String username = null;
        String jwtToken = null;
        String role = null;
        
        // JWT Token est au format "Bearer token". Enlever "Bearer " et récupérer uniquement le token
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            try {
                username = jwtTokenUtil.getUsernameFromToken(jwtToken);
                role = jwtTokenUtil.getRoleFromToken(jwtToken);
                System.out.println("Username extrait: [" + username + "]");
                System.out.println("Rôle extrait: [" + role + "]");
            } catch (IllegalArgumentException e) {
                System.out.println("⚠️ Impossible d'obtenir le JWT Token: " + e.getMessage());
            } catch (ExpiredJwtException e) {
                System.out.println("⚠️ JWT Token a expiré");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token expiré");
                return;
            } catch (MalformedJwtException e) {
                System.out.println("⚠️ Token JWT malformé: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            } catch (UnsupportedJwtException e) {
                System.out.println("⚠️ Token JWT non supporté: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            } catch (Exception e) {
                System.out.println("⚠️ Erreur lors de la validation du token: " + e.getMessage());
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        } else {
            System.out.println("⚠️ JWT Token n'a pas le format Bearer ou est absent");
        }

        // Une fois le token validé, configurer Spring Security Authentication
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                System.out.println("UserDetails chargé pour: " + username);
                
                // Log détaillé des autorités du UserDetails
                String authorities = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.joining(", "));
                System.out.println("Autorités du UserDetails: [" + authorities + "]");
                
                // Si le token est valide, configurer Spring Security Authentication
                if (jwtTokenUtil.validateToken(jwtToken, userDetails)) {
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Configurer l'authentification dans le contexte
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                    System.out.println("✅ Authentification réussie pour: " + username);
                    
                    // Log des autorités dans le token d'authentification
                    String tokenAuthorities = authenticationToken.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.joining(", "));
                    System.out.println("Autorités dans le token d'authentification: [" + tokenAuthorities + "]");
                    
                    if (tokenAuthorities.equals(role)) {
                        System.out.println("✅ Le rôle dans le token correspond aux autorités");
                    } else {
                        System.out.println("⚠️ Le rôle dans le token [" + role + "] est différent des autorités [" + tokenAuthorities + "]");
                    }
                } else {
                    System.out.println("⚠️ Token invalide pour l'utilisateur: " + username);
                }
            } catch (Exception e) {
                System.out.println("⚠️ Erreur lors de l'authentification de l'utilisateur: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // Log de l'état d'authentification avant de continuer la chaîne
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            System.out.println("✅ Utilisateur authentifié: " + 
                SecurityContextHolder.getContext().getAuthentication().getName() + 
                " avec autorités: " + 
                SecurityContextHolder.getContext().getAuthentication().getAuthorities());
        } else {
            System.out.println("⚠️ Aucune authentification dans le contexte");
        }
        
        chain.doFilter(request, response);
        
        // Log après le traitement de la requête
        System.out.println("Requête " + method + " " + requestURI + " traitée");
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            System.out.println("Contexte après traitement: Authentifié comme " + 
                SecurityContextHolder.getContext().getAuthentication().getName());
        } else {
            System.out.println("Contexte après traitement: Non authentifié");
        }
        System.out.println("=== FIN FILTRAGE JWT ===");
    }
}
