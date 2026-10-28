package com.orquestria.api.task;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.*;
import com.orquestria.api.auth.AuthService;
import com.orquestria.api.auth.AppUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.orquestria.api.board.BoardColumn;
import com.orquestria.api.board.BoardColumnRepository;
import com.orquestria.api.common.InvalidBoardOperationException;
import com.orquestria.api.project.Project;
import com.orquestria.api.project.ProjectRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock ProjectRepository projects;
    @Mock BoardColumnRepository columns;
    @Mock TaskRepository tasks;
    @Mock JdbcTemplate jdbc;
    @Mock AuthService auth;
    @Mock AppUser user;
    @InjectMocks TaskService service;

    @Test
    void rejectColumnFromDifferentProject() {
        UUID expectedProjectId = UUID.randomUUID();
        UUID otherProjectId = UUID.randomUUID();
        UUID columnId = UUID.randomUUID();
        Project project = new Project("Projeto A", null);
        Project other = new Project("Projeto B", null);
        // Atribui IDs por reflection apenas neste teste unitário, sem banco.
        setId(project, expectedProjectId);
        setId(other, otherProjectId);
        BoardColumn column = new BoardColumn(other, "Backlog", 0, "slate");
        when(projects.findById(expectedProjectId)).thenReturn(Optional.of(project));
        when(columns.findById(columnId)).thenReturn(Optional.of(column));
        assertThrows(InvalidBoardOperationException.class, () ->
            service.create(expectedProjectId, new CreateTaskRequest("Tarefa", null, columnId, TaskPriority.MEDIA, 0, null, null, null)));
    }

    @Test
    void rejectAssigneeOutsideCurrentTeam() {
        UUID owner = UUID.randomUUID();
        UUID unknown = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID columnId = UUID.randomUUID();
        Project project = new Project("Projeto A", null);
        setId(project, projectId);
        project.setOwner(user);
        BoardColumn column = new BoardColumn(project, "Backlog", 0, "slate");
        when(projects.findById(projectId)).thenReturn(Optional.of(project));
        when(columns.findById(columnId)).thenReturn(Optional.of(column));
        when(user.getId()).thenReturn(owner);
        // A associação de responsáveis agora é específica do projeto, não da equipe global do dono.
        // Usar os argumentos efetivos evita o PotentialStubbingProblem do Mockito em strict mode.
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(projectId), eq(unknown))).thenReturn(0);
        assertThrows(ResponseStatusException.class, () ->
            service.create(projectId, new CreateTaskRequest("Tarefa", null, columnId, TaskPriority.MEDIA, 0, null, unknown.toString(), null)));
        verify(jdbc).queryForObject(contains("project_members"), eq(Integer.class), eq(projectId), eq(unknown));
    }

    @Test
    void rejectMalformedAssigneeId() {
        UUID projectId = UUID.randomUUID();
        UUID columnId = UUID.randomUUID();
        Project project = new Project("Projeto A", null);
        setId(project, projectId);
        BoardColumn column = new BoardColumn(project, "Backlog", 0, "slate");
        when(projects.findById(projectId)).thenReturn(Optional.of(project));
        when(columns.findById(columnId)).thenReturn(Optional.of(column));
        assertThrows(ResponseStatusException.class, () ->
            service.create(projectId, new CreateTaskRequest("Tarefa", null, columnId, TaskPriority.MEDIA, 0, null, "id-inventado", null)));
    }

    private void setId(Project project, UUID id) {
        try {
            java.lang.reflect.Field field = Project.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(project, id);
        } catch (ReflectiveOperationException ex) { throw new AssertionError(ex); }
    }
}
