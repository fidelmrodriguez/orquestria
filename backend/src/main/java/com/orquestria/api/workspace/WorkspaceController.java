package com.orquestria.api.workspace;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {
    private final WorkspaceService service;
    public WorkspaceController(WorkspaceService service) { this.service = service; }
    @PostMapping
    public ResponseEntity<WorkspaceResponse> create(@Valid @RequestBody CreateWorkspaceRequest request) {
        WorkspaceResponse result = service.create(request);
        return ResponseEntity.created(URI.create("/api/workspaces/" + result.id())).body(result);
    }
    @GetMapping
    public List<WorkspaceResponse> list() { return service.list(); }
    @GetMapping("/{id}")
    public WorkspaceResponse get(@PathVariable UUID id) { return service.findById(id); }
}
