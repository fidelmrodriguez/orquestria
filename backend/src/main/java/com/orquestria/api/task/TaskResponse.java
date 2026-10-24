package com.orquestria.api.task;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;
public record TaskResponse(UUID id, UUID projectId, UUID columnId, String title, String description,
                           TaskPriority priority, int position, LocalDate dueDate, Instant createdAt, Instant updatedAt,
                           String assigneeId, List<String> tags, List<TaskCommentResponse> comments) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getProject().getId(), task.getColumn().getId(),
            task.getTitle(), task.getDescription(), task.getPriority(), task.getPosition(),
            task.getDueDate(), task.getCreatedAt(), task.getUpdatedAt(),
            task.getAssigneeId(), task.getTags(), task.getComments().stream().map(TaskCommentResponse::from).toList());
    }
}
