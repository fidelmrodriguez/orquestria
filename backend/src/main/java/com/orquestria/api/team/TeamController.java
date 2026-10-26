package com.orquestria.api.team;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TeamController {
    private final TeamService service;
    public TeamController(TeamService service) { this.service = service; }

    public record AddMemberRequest(@NotNull UUID userId) {}

    @GetMapping("/users/search")
    public List<TeamService.DirectoryUser> search(@RequestParam(name = "q", defaultValue = "") String query) {
        return service.search(query);
    }

    @GetMapping("/team/members")
    public List<TeamService.DirectoryUser> members() { return service.members(); }

    @PostMapping("/team/members")
    public ResponseEntity<Void> add(@Valid @RequestBody AddMemberRequest request) {
        service.add(request.userId());
        return ResponseEntity.noContent().build();
    }

    // Compatível com o CORS atual, que já suporta POST autenticado.
    @PostMapping("/team/members/{memberId}/remove")
    public ResponseEntity<Void> remove(@PathVariable UUID memberId) {
        service.remove(memberId);
        return ResponseEntity.noContent().build();
    }
}
