package com.orquestria.api.auth;
import jakarta.validation.constraints.*;
public record RegisterRequest(@NotBlank @Size(min=2,max=120) String name,
 @NotBlank @Email @Size(max=190) String email,
 @NotBlank @Size(min=10,max=100) String password) {}
