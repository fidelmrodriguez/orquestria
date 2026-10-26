package com.orquestria.api.tags;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tags")
public class UserTagController {
    private final UserTagService tags;
    public UserTagController(UserTagService tags) { this.tags = tags; }
    public record TagBody(@NotBlank @Size(max = 32) String name) {}

    @GetMapping
    public List<UserTagService.TagDto> search(@RequestParam(name = "q", defaultValue = "") String q) {
        return tags.search(q);
    }

    @PostMapping
    public ResponseEntity<UserTagService.TagDto> add(@Valid @RequestBody TagBody body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tags.add(body.name()));
    }

    @PostMapping("/{id}/rename")
    public UserTagService.TagDto rename(@PathVariable UUID id, @Valid @RequestBody TagBody body) {
        return tags.rename(id, body.name());
    }

    @PostMapping("/{id}/remove")
    public ResponseEntity<Void> remove(@PathVariable UUID id) {
        tags.remove(id);
        return ResponseEntity.noContent().build();
    }
}
