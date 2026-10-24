package com.orquestria.api.project;

import java.time.Instant;
import java.util.UUID;
public record ProjectResponse(UUID id, String name, String description, Instant createdAt, UUID workspaceId) {
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(project.getId(), project.getName(), project.getDescription(),
            project.getCreatedAt(), project.getWorkspace() == null ? null : project.getWorkspace().getId());
    }
}
