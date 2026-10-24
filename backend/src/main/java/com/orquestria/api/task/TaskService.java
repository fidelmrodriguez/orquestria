package com.orquestria.api.task;

import com.orquestria.api.board.BoardColumn;
import com.orquestria.api.board.BoardColumnRepository;
import com.orquestria.api.common.InvalidBoardOperationException;
import com.orquestria.api.common.ResourceNotFoundException;
import com.orquestria.api.project.Project;
import com.orquestria.api.project.ProjectNotFoundException;
import com.orquestria.api.project.ProjectRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
    private final ProjectRepository projects;
    private final BoardColumnRepository columns;
    private final TaskRepository tasks;
    public TaskService(ProjectRepository projects, BoardColumnRepository columns, TaskRepository tasks) {
        this.projects = projects; this.columns = columns; this.tasks = tasks;
    }
    private BoardColumn requireColumn(UUID projectId, UUID columnId) {
        BoardColumn column = columns.findById(columnId)
            .orElseThrow(() -> new ResourceNotFoundException("Coluna"));
        if (!column.getProject().getId().equals(projectId)) {
            throw new InvalidBoardOperationException("A coluna não pertence ao projeto informado");
        }
        return column;
    }
    @Transactional
    public TaskResponse create(UUID projectId, CreateTaskRequest request) {
        Project project = projects.findById(projectId).orElseThrow(() -> new ProjectNotFoundException(projectId));
        BoardColumn column = requireColumn(projectId, request.columnId());
        TaskPriority priority = request.priority() == null ? TaskPriority.MEDIA : request.priority();
        String desc = request.description() == null ? null : request.description().trim();
        Task task = tasks.save(new Task(project, column, request.title().trim(), desc,
            priority, request.position(), request.dueDate()));
        return TaskResponse.from(task);
    }
    @Transactional(readOnly = true)
    public List<TaskResponse> list(UUID projectId) {
        if (!projects.existsById(projectId)) throw new ProjectNotFoundException(projectId);
        return tasks.findByProject_IdOrderByPositionAscIdAsc(projectId).stream().map(TaskResponse::from).toList();
    }
    @Transactional
    public TaskResponse move(UUID projectId, UUID taskId, MoveTaskRequest request) {
        Task task = tasks.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Tarefa"));
        if (!task.getProject().getId().equals(projectId)) throw new ResourceNotFoundException("Tarefa");
        BoardColumn column = requireColumn(projectId, request.columnId());
        task.moveTo(column, request.position());
        return TaskResponse.from(tasks.saveAndFlush(task));
    }
}
