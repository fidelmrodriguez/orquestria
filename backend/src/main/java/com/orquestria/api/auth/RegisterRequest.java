package com.orquestria.api.auth;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @NotBlank @Pattern(regexp = "[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}",
                message = "Usuário deve ter de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado") String username,
        @NotBlank @Email @Size(max = 190) String email,
        @NotBlank @Size(min = 10, max = 100) String password) {}
