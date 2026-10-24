package com.orquestria.api.workspace;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspaces")
public class Workspace {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(length = 1000)
    private String description;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    protected Workspace() {}
    public Workspace(String name, String description) { this.name = name; this.description = description; }
    @PrePersist void beforeInsert() { if (createdAt == null) createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
}
