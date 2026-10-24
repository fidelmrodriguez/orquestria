package com.orquestria.api.task;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
public record TaskResponse(UUID id, UUID projectId, UUID columnId, String title, String description,
                           TaskPriority priority, int position, LocalDate dueDate, Instant createdAt, Instant updatedAt) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getProject().getId(), task.getColumn().getId(),
            task.getTitle(), task.getDescription(), task.getPriority(), task.getPosition(),
            task.getDueDate(), task.getCreatedAt(), task.getUpdatedAt());
    }
}
