package com.ecomub.stocks.model.auth;


import com.ecomub.stocks.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InscriptionRequest {
    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(min = 4, max = 50, message = "Le nom d'utilisateur doit avoir entre 4 et 50 caractères")
    private String nomUtilisateur;
    
    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$", 
             message = "Le mot de passe doit contenir au moins un chiffre, une majuscule, une minuscule et un caractère spécial")
    private String motDePasse;
    
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;
    
    private Role role;
}
