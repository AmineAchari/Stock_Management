package com.ecomub.stocks.model.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ConnexionRequest {
    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    private String nomUtilisateur;
    
    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;
}
