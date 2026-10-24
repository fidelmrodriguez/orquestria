package com.orquestria.api.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 120, message = "O nome deve ter até 120 caracteres")
        String name,
        @Size(max = 2000, message = "A descrição deve ter até 2000 caracteres")
        String description
) {
}
