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
    public TaskController(TaskService service) { this.service = service; }
    @GetMapping
    public List<TaskResponse> list(@PathVariable UUID projectId) { return service.list(projectId); }
    @PostMapping
    public ResponseEntity<TaskResponse> create(@PathVariable UUID projectId, @Valid @RequestBody CreateTaskRequest request) {
        TaskResponse result = service.create(projectId, request);
        return ResponseEntity.created(URI.create("/api/projects/" + projectId + "/tasks/" + result.id())).body(result);
    }
    @PostMapping("/{taskId}/edit")
    public TaskResponse edit(@PathVariable UUID projectId, @PathVariable UUID taskId,
                             @Valid @RequestBody UpdateTaskRequest request) {
        return service.edit(projectId, taskId, request);
    }
    @PostMapping("/{taskId}/comments")
    public TaskResponse comment(@PathVariable UUID projectId, @PathVariable UUID taskId,
                                @Valid @RequestBody CreateTaskCommentRequest request) {
        return service.comment(projectId, taskId, request);
    }
    // POST representa a ação de mover uma tarefa e também funciona em hospedagens
    // que não disponibilizam PATCH no preflight CORS. PATCH permanece compatível.
    @RequestMapping(value = "/{taskId}/move", method = {RequestMethod.PATCH, RequestMethod.POST})
    public TaskResponse move(@PathVariable UUID projectId, @PathVariable UUID taskId,
                             @Valid @RequestBody MoveTaskRequest request) {
        return service.move(projectId, taskId, request);
    }
}
