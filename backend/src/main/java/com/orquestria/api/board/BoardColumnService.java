package com.orquestria.api.board;

import com.orquestria.api.project.Project;
import com.orquestria.api.project.ProjectNotFoundException;
import com.orquestria.api.project.ProjectRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BoardColumnService {
    private final ProjectRepository projects;
    private final BoardColumnRepository columns;
    public BoardColumnService(ProjectRepository projects, BoardColumnRepository columns) {
        this.projects = projects; this.columns = columns;
    }
    @Transactional
    public BoardColumnResponse create(UUID projectId, CreateBoardColumnRequest request) {
        Project project = projects.findById(projectId).orElseThrow(() -> new ProjectNotFoundException(projectId));
        String color = request.color() == null || request.color().isBlank() ? "slate" : request.color().trim();
        return BoardColumnResponse.from(columns.save(new BoardColumn(project, request.title().trim(), request.position(), color)));
    }
    @Transactional
    public BoardColumnResponse rename(UUID projectId, UUID columnId, RenameBoardColumnRequest request) {
        BoardColumn column = columns.findById(columnId)
            .orElseThrow(() -> new com.orquestria.api.common.ResourceNotFoundException("Coluna"));
        if (!column.getProject().getId().equals(projectId)) {
            throw new com.orquestria.api.common.ResourceNotFoundException("Coluna");
        }
        column.rename(request.title().trim());
        return BoardColumnResponse.from(column);
    }
    @Transactional(readOnly = true)
    public List<BoardColumnResponse> list(UUID projectId) {
        if (!projects.existsById(projectId)) throw new ProjectNotFoundException(projectId);
        return columns.findByProject_IdOrderByPositionAscIdAsc(projectId)
            .stream().map(BoardColumnResponse::from).toList();
    }
}
