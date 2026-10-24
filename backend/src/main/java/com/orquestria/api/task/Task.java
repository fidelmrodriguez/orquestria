package com.orquestria.api.task;

import com.orquestria.api.board.BoardColumn;
import com.orquestria.api.project.Project;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tasks")
public class Task {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "column_id", nullable = false)
    private BoardColumn column;
    @Column(nullable = false, length = 180)
    private String title;
    @Column(length = 2000)
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TaskPriority priority;
    @Column(nullable = false)
    private int position;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    protected Task() {}
    public Task(Project project, BoardColumn column, String title, String description,
                TaskPriority priority, int position, LocalDate dueDate) {
        this.project = project; this.column = column; this.title = title; this.description = description;
        this.priority = priority; this.position = position; this.dueDate = dueDate;
    }
    @PrePersist void beforeInsert() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void beforeUpdate() { updatedAt = Instant.now(); }
    public void moveTo(BoardColumn column, int position) { this.column = column; this.position = position; }
    public UUID getId() { return id; }
    public Project getProject() { return project; }
    public BoardColumn getColumn() { return column; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public TaskPriority getPriority() { return priority; }
    public int getPosition() { return position; }
    public LocalDate getDueDate() { return dueDate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
