package com.orquestria.api.task;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    /** Fetch comments with tasks to avoid one query per card on board loading. */
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.comments WHERE t.project.id = :projectId ORDER BY t.position ASC, t.id ASC")
    List<Task> findByProject_IdOrderByPositionAscIdAsc(@Param("projectId") UUID projectId);
}
