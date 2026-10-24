package com.orquestria.api.board;

import com.orquestria.api.project.Project;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "board_columns")
public class BoardColumn {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    @Column(nullable = false, length = 80)
    private String title;
    @Column(nullable = false)
    private int position;
    @Column(nullable = false, length = 32)
    private String color;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    protected BoardColumn() {}
    public BoardColumn(Project project, String title, int position, String color) {
        this.project = project;
        this.title = title;
        this.position = position;
        this.color = color;
    }
    @PrePersist void beforeInsert() { if (createdAt == null) createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public Project getProject() { return project; }
    public String getTitle() { return title; }
    public int getPosition() { return position; }
    public String getColor() { return color; }
    public Instant getCreatedAt() { return createdAt; }
}
