package com.orquestria.api.board;

import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Rotas DELETE complementares às rotas GET/POST/PATCH já existentes. */
@RestController
public class BoardDeletionController {
    private final BoardDeletionService service;

    public BoardDeletionController(BoardDeletionService service) {
        this.service = service;
    }

    @DeleteMapping("/api/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        service.deleteTask(projectId, taskId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/projects/{projectId}/columns/{columnId}")
    public ResponseEntity<Void> deleteColumn(@PathVariable UUID projectId, @PathVariable UUID columnId) {
        service.deleteColumn(projectId, columnId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/projects/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID projectId) {
        service.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/workspaces/{workspaceId}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable UUID workspaceId) {
        service.deleteWorkspace(workspaceId);
        return ResponseEntity.noContent().build();
    }
}
