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
    public BoardColumnController(BoardColumnService service) { this.service = service; }
    @PostMapping("/{columnId}/rename")
    public BoardColumnResponse rename(@PathVariable UUID projectId, @PathVariable UUID columnId,
            @Valid @RequestBody RenameBoardColumnRequest request) {
        return service.rename(projectId, columnId, request);
    }
    @GetMapping
    public List<BoardColumnResponse> list(@PathVariable UUID projectId) { return service.list(projectId); }
    @PostMapping
    public ResponseEntity<BoardColumnResponse> create(@PathVariable UUID projectId,
            @Valid @RequestBody CreateBoardColumnRequest request) {
        BoardColumnResponse result = service.create(projectId, request);
        return ResponseEntity.created(URI.create("/api/projects/" + projectId + "/columns/" + result.id())).body(result);
    }
}
