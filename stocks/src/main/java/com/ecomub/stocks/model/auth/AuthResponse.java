package com.ecomub.stocks.model.auth;

import com.ecomub.stocks.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String nomUtilisateur;
    private String email;
    private Role role;
    private long expiresIn;
    
    // Constructeur avec juste le token pour compatibilité
    public AuthResponse(String token) {
        this.token = token;
    }
}
