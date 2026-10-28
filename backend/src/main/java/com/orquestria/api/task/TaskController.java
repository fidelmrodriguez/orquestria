package com.orquestria.api.task;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
public class TaskController {
    private final TaskService service;
    private final com.orquestria.api.auth.OwnershipGuard guard;
    public TaskController(TaskService service,com.orquestria.api.auth.OwnershipGuard guard) {
       this.service=service;this.guard=guard;
    }
    @GetMapping
    public List<TaskResponse> list(@PathVariable UUID projectId) { guard.project(projectId); return service.list(projectId); }
    @PostMapping
    public ResponseEntity<TaskResponse> create(@PathVariable UUID projectId, @Valid @RequestBody CreateTaskRequest request) {
        guard.project(projectId);
        TaskResponse result = service.create(projectId, request);
        return ResponseEntity.created(URI.create("/api/projects/" + projectId + "/tasks/" + result.id())).body(result);
    }
    @PostMapping("/{taskId}/duplicate")
    public ResponseEntity<TaskResponse> duplicate(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        guard.project(projectId);
        TaskResponse result = service.duplicate(projectId, taskId);
        return ResponseEntity.created(URI.create("/api/projects/" + projectId + "/tasks/" + result.id())).body(result);
    }

    @PostMapping("/{taskId}/edit")
    public TaskResponse edit(@PathVariable UUID projectId, @PathVariable UUID taskId,
                             @Valid @RequestBody UpdateTaskRequest request) {
        guard.project(projectId);
        return service.edit(projectId, taskId, request);
    }
    @PostMapping("/{taskId}/comments")
    public TaskResponse comment(@PathVariable UUID projectId, @PathVariable UUID taskId,
                                @Valid @RequestBody CreateTaskCommentRequest request) {
        guard.project(projectId);
        return service.comment(projectId, taskId,
            new CreateTaskCommentRequest(guard.current().getId().toString(), request.message()));
    }
    // The POST alias remains compatible with deployments that block DELETE preflight.
    @RequestMapping(value = "/{taskId}/comments/{commentId}", method = RequestMethod.DELETE)
    public TaskResponse deleteComment(@PathVariable UUID projectId, @PathVariable UUID taskId,
                                      @PathVariable UUID commentId) {
        guard.project(projectId);
        return service.deleteComment(projectId, taskId, commentId);
    }
    @PostMapping("/{taskId}/comments/{commentId}/delete")
    public TaskResponse deleteCommentPost(@PathVariable UUID projectId, @PathVariable UUID taskId,
                                          @PathVariable UUID commentId) {
        guard.project(projectId);
        return service.deleteComment(projectId, taskId, commentId);
    }
    // POST representa a ação de mover uma tarefa e também funciona em hospedagens
    // que não disponibilizam PATCH no preflight CORS. PATCH permanece compatível.
    @RequestMapping(value = "/{taskId}/move", method = {RequestMethod.PATCH, RequestMethod.POST})
    public TaskResponse move(@PathVariable UUID projectId, @PathVariable UUID taskId,
                             @Valid @RequestBody MoveTaskRequest request) {
        guard.project(projectId);
        return service.move(projectId, taskId, request);
    }
}
