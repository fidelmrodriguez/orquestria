package com.orquestria.api.board;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}/columns")
public class BoardColumnController {
    private final BoardColumnService service;
    private final com.orquestria.api.auth.OwnershipGuard guard;
    public BoardColumnController(BoardColumnService service,com.orquestria.api.auth.OwnershipGuard guard) {
        this.service=service;this.guard=guard;
    }
    @PostMapping("/{columnId}/rename")
    public BoardColumnResponse rename(@PathVariable UUID projectId, @PathVariable UUID columnId,
            @Valid @RequestBody RenameBoardColumnRequest request) {
        guard.project(projectId);
        return service.rename(projectId, columnId, request);
    }
    @GetMapping
    public List<BoardColumnResponse> list(@PathVariable UUID projectId) { guard.project(projectId); return service.list(projectId); }
    @PostMapping
    public ResponseEntity<BoardColumnResponse> create(@PathVariable UUID projectId,
            @Valid @RequestBody CreateBoardColumnRequest request) {
        guard.project(projectId);
        BoardColumnResponse result = service.create(projectId, request);
        return ResponseEntity.created(URI.create("/api/projects/" + projectId + "/columns/" + result.id())).body(result);
    }
}
