package com.orquestria.api.task;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity
@Table(name="task_comments")
public class TaskComment {
    @Id @GeneratedValue(strategy=GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="task_id", nullable=false)
    private Task task;
    @Column(name="author_id", nullable=false, length=160)
    private String authorId;
    @Column(nullable=false, length=2000)
    private String message;
    @Column(name="created_at", nullable=false, updatable=false)
    private Instant createdAt;
    protected TaskComment() {}
    TaskComment(Task task, String authorId, String message) {
        this.task=task; this.authorId=authorId; this.message=message;
    }
    @PrePersist void beforePersist() { if (createdAt == null) createdAt=Instant.now(); }
    public UUID getId() { return id; }
    public String getAuthorId() { return authorId; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
}
