package com.ecomub.stocks.controller;
import com.ecomub.stocks.model.auth.AuthResponse;
import com.ecomub.stocks.model.auth.ConnexionRequest;
import com.ecomub.stocks.model.auth.InscriptionRequest;
import com.ecomub.stocks.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000/", maxAge = 3600)
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/inscription")
    public ResponseEntity<?> inscription(@Valid @RequestBody InscriptionRequest request) {
        try {
            System.out.println("Tentative d'inscription pour: " + request.getNomUtilisateur());
            String message = authService.inscription(request);
            System.out.println("Inscription réussie pour: " + request.getNomUtilisateur());
            return ResponseEntity.ok().body(Map.of("message", message, "success", true));
        } catch (Exception e) {
            System.out.println("Erreur lors de l'inscription: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage(), "success", false));
        }
    }

    @PostMapping("/connexion")
    public ResponseEntity<?> connexion(@Valid @RequestBody ConnexionRequest request) {
        try {
            System.out.println("Contrôleur: Tentative de connexion pour: " + request.getNomUtilisateur());
            AuthResponse response = authService.connexion(request);
            System.out.println("Contrôleur: Connexion réussie pour: " + request.getNomUtilisateur());
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException | UsernameNotFoundException e) {
            System.out.println("Contrôleur: Identifiants incorrects: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Identifiants incorrects", "success", false));
        } catch (DisabledException e) {
            System.out.println("Contrôleur: Compte désactivé: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage(), "success", false));
        } catch (Exception e) {
            System.out.println("Contrôleur: Erreur lors de la connexion: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la connexion", "success", false));
        }
    }
    
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestParam String refreshToken) {
        try {
            System.out.println("Tentative de rafraîchissement du token");
            AuthResponse response = authService.refreshToken(refreshToken);
            System.out.println("Rafraîchissement du token réussi");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Erreur lors du rafraîchissement du token: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage(), "success", false));
        }
    }
    
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Map<String, String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
            System.out.println("Erreur de validation: " + fieldName + " - " + errorMessage);
        });
        return errors;
    }
}

