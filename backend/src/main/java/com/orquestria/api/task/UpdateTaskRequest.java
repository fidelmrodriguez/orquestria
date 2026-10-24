package com.orquestria.api.task;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;
public record UpdateTaskRequest(
    @NotBlank @Size(max=180) String title,
    @Size(max=2000) String description,
    TaskPriority priority,
    LocalDate dueDate,
    @Size(max=160) String assigneeId,
    List<@Size(max=80) String> tags
) {}
