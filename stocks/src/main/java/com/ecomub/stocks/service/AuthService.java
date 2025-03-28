package com.ecomub.stocks.service;

import com.ecomub.stocks.model.Utilisateur;
import com.ecomub.stocks.model.auth.AuthResponse;
import com.ecomub.stocks.model.auth.ConnexionRequest;
import com.ecomub.stocks.model.auth.InscriptionRequest;
import com.ecomub.stocks.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;


@Service
public class AuthService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private com.ecomub.stocks.config.JwtUtil jwtUtil;
    
    @Value("${jwt.expiration}")
    private Long expiration;
    
    // Compteur pour les tentatives de connexion échouées
    private final Map<String, Integer> loginAttempts = new HashMap<>();
    private final Map<String, LocalDateTime> lockoutTimes = new HashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCKOUT_TIME_MINUTES = 15;

    public String inscription(InscriptionRequest request) {
        // Vérification si le nom d'utilisateur existe déjà
        if (utilisateurRepository.findByNomUtilisateur(request.getNomUtilisateur()).isPresent()) {
            throw new RuntimeException("Nom d'utilisateur déjà utilisé !");
        }
        
        // Vérification si l'email existe déjà
        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé !");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNomUtilisateur(request.getNomUtilisateur());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setEmail(request.getEmail());
        utilisateur.setRole(request.getRole());
        utilisateur.setDateCreation(LocalDateTime.now());
        utilisateur.setActif(true);

        utilisateurRepository.save(utilisateur);
        return "Utilisateur inscrit avec succès";
    }

    public AuthResponse connexion(ConnexionRequest request) {
        String nomUtilisateur = request.getNomUtilisateur();
        System.out.println("Tentative de connexion pour: " + nomUtilisateur);
        
        // Vérifier si l'utilisateur est verrouillé
        if (isUserLocked(nomUtilisateur)) {
            LocalDateTime unlockTime = lockoutTimes.get(nomUtilisateur).plusMinutes(LOCKOUT_TIME_MINUTES);
            throw new DisabledException("Compte temporairement verrouillé jusqu'à " + unlockTime);
        }
        
        try {
            // Charger les détails de l'utilisateur directement depuis le repository
            Utilisateur utilisateur = utilisateurRepository.findByNomUtilisateur(nomUtilisateur)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable !"));

            System.out.println("Utilisateur trouvé en base: " + utilisateur.getNomUtilisateur());
            System.out.println("Mot de passe stocké (encodé): " + utilisateur.getMotDePasse());
            
            // Vérifier le mot de passe manuellement
        if (!passwordEncoder.matches(request.getMotDePasse(), utilisateur.getMotDePasse())) {
                System.out.println("Mot de passe incorrect pour: " + nomUtilisateur);
                incrementFailedAttempts(nomUtilisateur);
                throw new BadCredentialsException("Identifiants incorrects");
            }
            
            System.out.println("Mot de passe vérifié avec succès pour: " + nomUtilisateur);
            
            // Authentification réussie
            loginAttempts.remove(nomUtilisateur);
            lockoutTimes.remove(nomUtilisateur);
            
            // Charger les détails pour Spring Security
            UserDetails userDetails = userDetailsService.loadUserByUsername(nomUtilisateur);
            
            // Mettre à jour la dernière connexion
            utilisateur.setDernierConnexion(LocalDateTime.now());
            utilisateur.setTentativesConnexion(0);
            utilisateur.setVerrouille(false);
            utilisateurRepository.save(utilisateur);
            
            // Générer les tokens
            String accessToken = jwtUtil.generateToken(userDetails);
            String refreshToken = jwtUtil.generateRefreshToken(userDetails);
            
            System.out.println("Token généré avec succès pour: " + nomUtilisateur);
            
            // Créer et retourner la réponse complète
            AuthResponse response = new AuthResponse();
            response.setToken(accessToken);
            response.setRefreshToken(refreshToken);
            response.setNomUtilisateur(utilisateur.getNomUtilisateur());
            response.setEmail(utilisateur.getEmail());
            response.setRole(utilisateur.getRole());
            response.setExpiresIn(expiration);
            
            return response;
            
        } catch (UsernameNotFoundException e) {
            System.out.println("Utilisateur non trouvé: " + nomUtilisateur);
            throw new BadCredentialsException("Identifiants incorrects");
        } catch (BadCredentialsException e) {
            incrementFailedAttempts(nomUtilisateur);
            throw e;
        } catch (Exception e) {
            System.out.println("Erreur lors de l'authentification: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de l'authentification: " + e.getMessage());
        }
    }
    
    public AuthResponse refreshToken(String refreshToken) {
        try {
            String username = jwtUtil.getUsernameFromToken(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            if (!jwtUtil.validateToken(refreshToken, userDetails)) {
                throw new RuntimeException("Refresh token invalide ou expiré");
            }
            
            Utilisateur utilisateur = utilisateurRepository.findByNomUtilisateur(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable !"));
            
            // Vérifier si l'utilisateur est toujours actif
            if (!utilisateur.isEnabled()) {
                throw new DisabledException("Compte désactivé");
            }
            
            // Générer un nouveau token d'accès
            String newAccessToken = jwtUtil.generateToken(userDetails);
            
            AuthResponse response = new AuthResponse();
            response.setToken(newAccessToken);
            response.setRefreshToken(refreshToken); // On garde le même refresh token
            response.setNomUtilisateur(utilisateur.getNomUtilisateur());
            response.setEmail(utilisateur.getEmail());
            response.setRole(utilisateur.getRole());
            response.setExpiresIn(expiration);
            
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Refresh token invalide");
        }
    }
    
    private boolean isUserLocked(String nomUtilisateur) {
        if (lockoutTimes.containsKey(nomUtilisateur)) {
            LocalDateTime lockTime = lockoutTimes.get(nomUtilisateur);
            if (lockTime.plusMinutes(LOCKOUT_TIME_MINUTES).isAfter(LocalDateTime.now())) {
                return true;
            } else {
                // La période de verrouillage est terminée
                loginAttempts.remove(nomUtilisateur);
                lockoutTimes.remove(nomUtilisateur);
                return false;
            }
        }
        return false;
    }
    
    private void incrementFailedAttempts(String nomUtilisateur) {
        int attempts = loginAttempts.getOrDefault(nomUtilisateur, 0) + 1;
        loginAttempts.put(nomUtilisateur, attempts);
        
        // Mettre à jour les tentatives dans la base de données aussi
        utilisateurRepository.findByNomUtilisateur(nomUtilisateur).ifPresent(utilisateur -> {
            utilisateur.setTentativesConnexion(utilisateur.getTentativesConnexion() + 1);
            
            if (attempts >= MAX_ATTEMPTS) {
                utilisateur.setVerrouille(true);
                utilisateur.setDateVerrouillage(LocalDateTime.now());
                lockoutTimes.put(nomUtilisateur, LocalDateTime.now());
            }
            
            utilisateurRepository.save(utilisateur);
        });
    }
}