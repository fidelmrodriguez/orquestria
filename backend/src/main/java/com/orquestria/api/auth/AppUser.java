package com.orquestria.api.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import java.util.Locale;

@Entity
@Table(name = "app_users")
public class AppUser {
    @Id private UUID id;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, unique = true, length = 120) private String username;
    @Column(nullable = false, unique = true, length = 190) private String email;
    @Column(name = "password_hash", nullable = false, length = 100) private String passwordHash;
    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 12)
    private AccountType accountType;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

    protected AppUser() {}

    public AppUser(String name, String username, String email, String passwordHash, AccountType type) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.accountType = type;
        this.createdAt = Instant.now();
    }

    // Mantém compatibilidade com outros construtores já usados nos testes antigos.
    public AppUser(String name, String email, String passwordHash, AccountType type) {
        this(name, name.trim().toLowerCase(Locale.ROOT), email, passwordHash, type);
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public AccountType getAccountType() { return accountType; }
}
