package com.orquestria.api.task;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;
public record CreateTaskRequest(
    @NotBlank @Size(max = 180) String title,
    @Size(max = 2000) String description,
    @NotNull UUID columnId,
    TaskPriority priority,
    @Min(0) @Max(100000) int position,
    LocalDate dueDate
) {}
