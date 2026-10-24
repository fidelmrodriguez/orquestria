package com.orquestria.api.task;
import java.time.Instant;
import java.util.UUID;
public record TaskCommentResponse(UUID id, String authorId, String message, Instant createdAt) {
    public static TaskCommentResponse from(TaskComment comment) {
        return new TaskCommentResponse(comment.getId(), comment.getAuthorId(), comment.getMessage(), comment.getCreatedAt());
    }
}
