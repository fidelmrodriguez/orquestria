package com.orquestria.api.board;

import com.orquestria.api.auth.AuthService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exclusões explícitas do quadro. Nenhuma rotina agendada ou exclusão de conta.
 *
 * O SQL sempre restringe o acesso ao proprietário autenticado. Recursos de
 * outro usuário respondem como inexistentes, evitando vazamento de existência.
 */
@Service
public class BoardDeletionService {
    private final JdbcTemplate jdbc;
    private final AuthService auth;

    public BoardDeletionService(JdbcTemplate jdbc, AuthService auth) {
        this.jdbc = jdbc;
        this.auth = auth;
    }

    private record TaskPosition(UUID columnId, int position) {}

    private UUID ownerId() {
        return auth.currentUser().getId();
    }

    private int count(String sql, Object... args) {
        Integer value = jdbc.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }

    private void requireOwnedProject(UUID projectId, UUID ownerId) {
        if (count("SELECT COUNT(*) FROM projects WHERE id = ? AND owner_id = ?", projectId, ownerId) == 0) {
            throw notFound();
        }
    }

    private void requireOwnedWorkspace(UUID workspaceId, UUID ownerId) {
        if (count("SELECT COUNT(*) FROM workspaces WHERE id = ? AND owner_id = ?", workspaceId, ownerId) == 0) {
            throw notFound();
        }
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Recurso não encontrado");
    }

    @Transactional
    public void deleteTask(UUID projectId, UUID taskId) {
        requireOwnedProject(projectId, ownerId());
        List<TaskPosition> positions = jdbc.query(
                "SELECT column_id, position FROM tasks WHERE id = ? AND project_id = ?",
                (rs, index) -> new TaskPosition(rs.getObject("column_id", UUID.class), rs.getInt("position")),
                taskId, projectId);
        if (positions.isEmpty()) {
            throw notFound();
        }
        // task_comments.task_id possui ON DELETE CASCADE na V3.
        if (jdbc.update("DELETE FROM tasks WHERE id = ? AND project_id = ?", taskId, projectId) != 1) {
            throw notFound();
        }
        TaskPosition position = positions.get(0);
        jdbc.update("UPDATE tasks SET position = position - 1 WHERE project_id = ? AND column_id = ? AND position > ?",
                projectId, position.columnId(), position.position());
    }

    @Transactional
    public void deleteColumn(UUID projectId, UUID columnId) {
        requireOwnedProject(projectId, ownerId());
        List<Integer> positions = jdbc.query(
                "SELECT position FROM board_columns WHERE id = ? AND project_id = ?",
                (rs, index) -> rs.getInt("position"), columnId, projectId);
        if (positions.isEmpty()) {
            throw notFound();
        }
        if (count("SELECT COUNT(*) FROM tasks WHERE column_id = ? AND project_id = ?", columnId, projectId) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Mova ou exclua as tarefas da coluna antes de removê-la");
        }
        if (jdbc.update("DELETE FROM board_columns WHERE id = ? AND project_id = ?", columnId, projectId) != 1) {
            throw notFound();
        }
        jdbc.update("UPDATE board_columns SET position = position - 1 WHERE project_id = ? AND position > ?",
                projectId, positions.get(0));
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        UUID ownerId = ownerId();
        requireOwnedProject(projectId, ownerId);
        // Ordem explícita: comentários são removidos pelo CASCADE de tasks.
        // O FK tasks.column_id NÃO possui ON DELETE CASCADE.
        jdbc.update("DELETE FROM tasks WHERE project_id = ?", projectId);
        jdbc.update("DELETE FROM board_columns WHERE project_id = ?", projectId);
        if (jdbc.update("DELETE FROM projects WHERE id = ? AND owner_id = ?", projectId, ownerId) != 1) {
            throw notFound();
        }
    }

    @Transactional
    public void deleteWorkspace(UUID workspaceId) {
        UUID ownerId = ownerId();
        requireOwnedWorkspace(workspaceId, ownerId);
        if (count("SELECT COUNT(*) FROM projects WHERE workspace_id = ?", workspaceId) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Remova ou transfira os projetos antes de excluir o workspace");
        }
        if (jdbc.update("DELETE FROM workspaces WHERE id = ? AND owner_id = ?", workspaceId, ownerId) != 1) {
            throw notFound();
        }
    }
}
