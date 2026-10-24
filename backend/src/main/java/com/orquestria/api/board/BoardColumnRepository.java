package com.orquestria.api.board;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface BoardColumnRepository extends JpaRepository<BoardColumn, UUID> {
    List<BoardColumn> findByProject_IdOrderByPositionAscIdAsc(UUID projectId);
}
