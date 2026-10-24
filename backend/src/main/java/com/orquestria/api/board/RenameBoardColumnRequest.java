package com.orquestria.api.board;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record RenameBoardColumnRequest(@NotBlank @Size(max=80) String title) {}
