package com.ecomub.stocks.service;

import com.ecomub.stocks.model.Utilisateur;
import com.ecomub.stocks.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service("userService")
public class UserService implements UserDetailsService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        try {
            System.out.println("UserService - Chargement de l'utilisateur: " + username);
            
            Optional<Utilisateur> optionalUtilisateur = utilisateurRepository.findByNomUtilisateur(username);
            if (!optionalUtilisateur.isPresent()) {
                System.out.println("UserService - Utilisateur non trouvé: " + username);
                throw new UsernameNotFoundException("Utilisateur non trouvé avec le nom: " + username);
            }
            
            Utilisateur utilisateur = optionalUtilisateur.get();
            
            // Log détaillé pour le débogage
            System.out.println("UserService - Utilisateur trouvé: " + utilisateur.getNomUtilisateur());
            System.out.println("UserService - Email: " + utilisateur.getEmail());
            System.out.println("UserService - Rôle: " + utilisateur.getRole().name());
            
            String roleAuthority = utilisateur.getRole().name();
            System.out.println("UserService - Autorité créée: " + roleAuthority);
            
            UserDetails userDetails = new User(
                utilisateur.getNomUtilisateur(),
                utilisateur.getMotDePasse(),
                Collections.singleton(new SimpleGrantedAuthority(roleAuthority))
            );
            
            System.out.println("UserService - UserDetails créé avec autorités: " + 
                userDetails.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(java.util.stream.Collectors.joining(", ")));
                
            return userDetails;
        } catch (Exception e) {
            System.out.println("UserService - Erreur: " + e.getMessage());
            e.printStackTrace();
            throw new UsernameNotFoundException("Erreur lors du chargement de l'utilisateur: " + e.getMessage());
        }
    }
}