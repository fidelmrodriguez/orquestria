package com.orquestria.api.auth;
import jakarta.validation.constraints.*;
public record LoginRequest(@NotBlank String identifier,@NotBlank String password) {}
