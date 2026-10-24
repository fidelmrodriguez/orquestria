package com.orquestria.api.board;

import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/** Rotas DELETE complementares às rotas GET/POST/PATCH já existentes. */
@RestController
public class BoardDeletionController {
    private final BoardDeletionService service;

    public BoardDeletionController(BoardDeletionService service) {
        this.service = service;
    }

    /**
     * Compatibilidade com navegadores/proxies que recusam o preflight OPTIONS
     * para DELETE. Ambos os verbos usam exatamente as mesmas regras de segurança,
     * verificações de propriedade e transações do serviço.
     */
    @PostMapping("/api/projects/{projectId}/tasks/{taskId}/delete")
    public ResponseEntity<Void> deleteTaskViaPost(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        return deleteTask(projectId, taskId);
    }

    @PostMapping("/api/projects/{projectId}/columns/{columnId}/delete")
    public ResponseEntity<Void> deleteColumnViaPost(@PathVariable UUID projectId, @PathVariable UUID columnId) {
        return deleteColumn(projectId, columnId);
    }

    @PostMapping("/api/projects/{projectId}/delete")
    public ResponseEntity<Void> deleteProjectViaPost(@PathVariable UUID projectId) {
        return deleteProject(projectId);
    }

    @PostMapping("/api/workspaces/{workspaceId}/delete")
    public ResponseEntity<Void> deleteWorkspaceViaPost(@PathVariable UUID workspaceId) {
        return deleteWorkspace(workspaceId);
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
