package com.orquestria.api.auth;
import java.time.Instant;
import java.util.UUID;
public record LoginResponse(String token, UUID id, String name, String email, AccountType accountType, Instant expiresAt) {}
