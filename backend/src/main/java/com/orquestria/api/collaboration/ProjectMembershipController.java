package com.orquestria.api.collaboration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectMembershipController {
    private final ProjectMembershipService service;
    public ProjectMembershipController(ProjectMembershipService service) { this.service = service; }
    public record AddMemberRequest(@NotNull UUID userId) {}

    @GetMapping("/invited")
    public List<ProjectMembershipService.InvitedProject> invited() { return service.invited(); }

    @GetMapping("/{projectId}/members")
    public List<ProjectMembershipService.Member> members(@PathVariable UUID projectId) {
        return service.members(projectId);
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<Void> add(@PathVariable UUID projectId, @Valid @RequestBody AddMemberRequest request) {
        service.add(projectId, request.userId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{projectId}/members/{memberId}/remove")
    public ResponseEntity<Void> remove(@PathVariable UUID projectId, @PathVariable UUID memberId) {
        service.remove(projectId, memberId);
        return ResponseEntity.noContent().build();
    }
}
