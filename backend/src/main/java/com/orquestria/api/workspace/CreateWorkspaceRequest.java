package com.orquestria.api.workspace;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record CreateWorkspaceRequest(
    @NotBlank @Size(max = 120) String name,
    @Size(max = 1000) String description
) {}
