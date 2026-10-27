package com.orquestria.api.task;

import com.orquestria.api.board.BoardColumn;
import com.orquestria.api.board.BoardColumnRepository;
import com.orquestria.api.common.InvalidBoardOperationException;
import com.orquestria.api.common.ResourceNotFoundException;
import com.orquestria.api.project.Project;
import com.orquestria.api.project.ProjectNotFoundException;
import com.orquestria.api.project.ProjectRepository;
import com.orquestria.api.auth.AuthService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
    private final ProjectRepository projects;
    private final BoardColumnRepository columns;
    private final TaskRepository tasks;
    private final JdbcTemplate jdbc;
    private final AuthService auth;
    public TaskService(ProjectRepository projects, BoardColumnRepository columns, TaskRepository tasks,
                       JdbcTemplate jdbc, AuthService auth) {
        this.projects = projects; this.columns = columns; this.tasks = tasks;
        this.jdbc = jdbc; this.auth = auth;
    }

    /** Ninguém pode forjar IDs de responsáveis fora do proprietário ou da equipe cadastrada. */
    private void validateAssignee(String assigneeId) {
        if (assigneeId == null || assigneeId.isBlank()) return;
        UUID target;
        try { target = UUID.fromString(assigneeId); }
        catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione um usuário cadastrado na equipe");
        }
        UUID owner = auth.currentUser().getId();
        if (owner.equals(target)) return;
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM team_members WHERE owner_id = ? AND member_id = ?",
            Integer.class, owner, target);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "O responsável precisa ser o proprietário ou um membro da equipe");
        }
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
        validateAssignee(request.assigneeId());
        TaskPriority priority = request.priority() == null ? TaskPriority.MEDIA : request.priority();
        String desc = request.description() == null ? null : request.description().trim();
        Task task = tasks.save(new Task(project, column, request.title().trim(), desc,
            priority, request.position(), request.dueDate()));
        task.setDetails(task.getTitle(), task.getDescription(), task.getPriority(), task.getDueDate(),
            request.assigneeId(), request.tags());
        return TaskResponse.from(task);
    }
    @Transactional(readOnly = true)
    public List<TaskResponse> list(UUID projectId) {
        if (!projects.existsById(projectId)) throw new ProjectNotFoundException(projectId);
        return tasks.findByProject_IdOrderByPositionAscIdAsc(projectId).stream().map(TaskResponse::from).toList();
    }
    private Task requireTask(UUID projectId, UUID taskId) {
        Task task = tasks.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Tarefa"));
        if (!task.getProject().getId().equals(projectId)) throw new ResourceNotFoundException("Tarefa");
        return task;
    }
    @Transactional
    public TaskResponse edit(UUID projectId, UUID taskId, UpdateTaskRequest request) {
        Task task = requireTask(projectId, taskId);
        // Não impede editar tarefas antigas que já possuíam IDs legados de responsáveis.
        if (!java.util.Objects.equals(task.getAssigneeId(), request.assigneeId())) {
            validateAssignee(request.assigneeId());
        }
        task.setDetails(request.title().trim(), request.description() == null ? null : request.description().trim(),
            request.priority(), request.dueDate(), request.assigneeId(), request.tags());
        return TaskResponse.from(tasks.saveAndFlush(task));
    }
    @Transactional
    public TaskResponse comment(UUID projectId, UUID taskId, CreateTaskCommentRequest request) {
        Task task = requireTask(projectId, taskId);
        task.addComment(request.authorId().trim(), request.message().trim());
        tasks.saveAndFlush(task);
        return TaskResponse.from(task);
    }
    /** Remove only a comment belonging to this task, never a comment from another project. */
    @Transactional
    public TaskResponse deleteComment(UUID projectId, UUID taskId, UUID commentId) {
        Task task = requireTask(projectId, taskId);
        boolean removed = task.getComments().removeIf(comment -> comment.getId().equals(commentId));
        if (!removed) throw new ResourceNotFoundException("Comentário");
        return TaskResponse.from(tasks.saveAndFlush(task));
    }

    @Transactional
    public TaskResponse move(UUID projectId, UUID taskId, MoveTaskRequest request) {
        Task task = tasks.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Tarefa"));
        if (!task.getProject().getId().equals(projectId)) throw new ResourceNotFoundException("Tarefa");
        BoardColumn column = requireColumn(projectId, request.columnId());
        // Inserir na posição solicitada, sem deixar posições duplicadas em nenhuma coluna.
        // Quando a origem é o destino, a posição é calculada após remover a própria tarefa.
        List<Task> projectTasks = tasks.findByProject_IdOrderByPositionAscIdAsc(projectId);
        UUID sourceId = task.getColumn().getId();
        List<Task> source = projectTasks.stream()
            .filter(item -> item.getColumn().getId().equals(sourceId) && !item.getId().equals(taskId))
            .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
        List<Task> destination = sourceId.equals(column.getId()) ? source : projectTasks.stream()
            .filter(item -> item.getColumn().getId().equals(column.getId()))
            .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
        int insertion = Math.max(0, Math.min(request.position(), destination.size()));
        destination.add(insertion, task);
        if (!sourceId.equals(column.getId())) {
            for (int i = 0; i < source.size(); i++) source.get(i).moveTo(source.get(i).getColumn(), i);
        }
        for (int i = 0; i < destination.size(); i++) destination.get(i).moveTo(column, i);
        tasks.flush();
        return TaskResponse.from(task);
    }
}
