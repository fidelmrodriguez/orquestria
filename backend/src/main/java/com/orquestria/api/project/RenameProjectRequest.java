package com.orquestria.api.project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record RenameProjectRequest(@NotBlank @Size(max=120) String name) {}
