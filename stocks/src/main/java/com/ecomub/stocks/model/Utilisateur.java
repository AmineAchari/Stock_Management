package com.ecomub.stocks.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type_role")
public class Utilisateur implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String nomUtilisateur;
    
    @Column(nullable = false)
    private String motDePasse;
    
    @Column(unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    private Role role;
    
    private LocalDateTime dateCreation;
    private LocalDateTime dernierConnexion;
    private boolean actif = true;
    private boolean verrouille = false;
    private int tentativesConnexion = 0;
    private LocalDateTime dateVerrouillage;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null) {
            return List.of();
        }
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getPassword() {
        // Return the 'motDePasse' field as the password
        return this.motDePasse;
    }

    @Override
    public String getUsername() {
        // Use 'nomUtilisateur' as the username for Spring Security
        return this.nomUtilisateur;
    }

    @Override
    public boolean isAccountNonExpired() {
        // Les comptes n'expirent pas dans cette application
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // Le compte est verrouillé si le champ verrouille est à true
        return !this.verrouille;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        // Les credentials n'expirent pas dans cette application
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Le compte est activé si le champ actif est à true
        return this.actif;
    }
    
    // Pour debug et logging
    @Override
    public String toString() {
        return "Utilisateur{" +
                "id=" + id +
                ", nomUtilisateur='" + nomUtilisateur + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", actif=" + actif +
                ", verrouille=" + verrouille +
                '}';
    }
}
