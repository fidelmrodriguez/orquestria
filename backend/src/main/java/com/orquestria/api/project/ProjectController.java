package com.orquestria.api.project;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse result = service.create(request);
        return ResponseEntity.created(URI.create("/api/projects/" + result.id())).body(result);
    }

    @org.springframework.web.bind.annotation.PostMapping("/{id}/rename")
    public ProjectResponse rename(@PathVariable UUID id, @Valid @RequestBody RenameProjectRequest request) {
        return service.rename(id, request);
    }
    @GetMapping
    public List<ProjectResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public ProjectResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }
}
