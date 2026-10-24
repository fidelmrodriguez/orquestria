package com.orquestria.api.auth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "user")
    Optional<AuthSession> findByTokenHashAndExpiresAtAfter(String hash, Instant now);
    void deleteByTokenHash(String hash);
}
