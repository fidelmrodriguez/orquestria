package com.orquestria.api.auth;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="auth_sessions")
public class AuthSession {
    @Id private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id") private AppUser user;
    @Column(name="token_hash",nullable=false,unique=true,length=64) private String tokenHash;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
    @Column(name="expires_at",nullable=false) private Instant expiresAt;
    protected AuthSession() {}
    public AuthSession(AppUser user,String hash,Instant expiresAt) {
        this.id=UUID.randomUUID();this.user=user;this.tokenHash=hash;
        this.createdAt=Instant.now();this.expiresAt=expiresAt;
    }
    public AppUser getUser(){return user;}
}
