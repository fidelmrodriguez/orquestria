package com.orquestria.api.task;
import jakarta.validation.constraints.*;
public record CreateTaskCommentRequest(
    @NotBlank @Size(max=160) String authorId,
    @NotBlank @Size(max=2000) String message
) {}
