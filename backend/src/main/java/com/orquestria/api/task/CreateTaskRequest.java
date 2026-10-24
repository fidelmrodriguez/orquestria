package com.orquestria.api.task;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;
public record CreateTaskRequest(
    @NotBlank @Size(max = 180) String title,
    @Size(max = 2000) String description,
    @NotNull UUID columnId,
    TaskPriority priority,
    @Min(0) @Max(100000) int position,
    LocalDate dueDate,
    @Size(max=160) String assigneeId,
    List<@Size(max=80) String> tags
) {}
