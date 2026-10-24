package com.orquestria.api.board;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.orquestria.api.auth.AppUser;
import com.orquestria.api.auth.AuthService;
import java.sql.ResultSet;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class BoardDeletionServiceTest {
    private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID PROJECT = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID WORKSPACE = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID COLUMN = UUID.fromString("00000000-0000-0000-0000-000000000004");
    private static final UUID TASK = UUID.fromString("00000000-0000-0000-0000-000000000005");

    @Mock private JdbcTemplate jdbc;
    @Mock private AuthService auth;
    @Mock private AppUser user;
    private BoardDeletionService service;

    @BeforeEach
    void setup() {
        service = new BoardDeletionService(jdbc, auth);
        when(auth.currentUser()).thenReturn(user);
        when(user.getId()).thenReturn(OWNER);
    }

    private void ownedProject() {
        when(jdbc.queryForObject(
                eq("SELECT COUNT(*) FROM projects WHERE id = ? AND owner_id = ?"),
                eq(Integer.class), eq(PROJECT), eq(OWNER))).thenReturn(1);
    }

    @Test
    void usuarioNaoPodeExcluirProjetoDeOutraConta() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.deleteProject(PROJECT));
        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(jdbc, never()).update(eq("DELETE FROM projects WHERE id = ? AND owner_id = ?"),
                eq(PROJECT), eq(OWNER));
    }

    @Test
    void projetoExcluiTarefasAntesDasColunasParaRespeitarAsChavesEstrangeiras() {
        ownedProject();
        when(jdbc.update(eq("DELETE FROM projects WHERE id = ? AND owner_id = ?"),
                eq(PROJECT), eq(OWNER))).thenReturn(1);

        service.deleteProject(PROJECT);

        InOrder sequence = inOrder(jdbc);
        sequence.verify(jdbc).update("DELETE FROM tasks WHERE project_id = ?", PROJECT);
        sequence.verify(jdbc).update("DELETE FROM board_columns WHERE project_id = ?", PROJECT);
        sequence.verify(jdbc).update("DELETE FROM projects WHERE id = ? AND owner_id = ?", PROJECT, OWNER);
    }

    @Test
    void colunaComTarefasRetornaConflitoSemExcluirNada() {
        ownedProject();
        when(jdbc.query(eq("SELECT position FROM board_columns WHERE id = ? AND project_id = ?"),
                any(RowMapper.class), eq(COLUMN), eq(PROJECT))).thenReturn(List.of(2));
        when(jdbc.queryForObject(eq("SELECT COUNT(*) FROM tasks WHERE column_id = ? AND project_id = ?"),
                eq(Integer.class), eq(COLUMN), eq(PROJECT))).thenReturn(3);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.deleteColumn(PROJECT, COLUMN));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(jdbc, never()).update(eq("DELETE FROM board_columns WHERE id = ? AND project_id = ?"),
                eq(COLUMN), eq(PROJECT));
    }

    @Test
    void colunaVaziaPodeSerExcluidaEReorganizaPosicoes() {
        ownedProject();
        when(jdbc.query(eq("SELECT position FROM board_columns WHERE id = ? AND project_id = ?"),
                any(RowMapper.class), eq(COLUMN), eq(PROJECT))).thenReturn(List.of(2));
        when(jdbc.update(eq("DELETE FROM board_columns WHERE id = ? AND project_id = ?"),
                eq(COLUMN), eq(PROJECT))).thenReturn(1);

        service.deleteColumn(PROJECT, COLUMN);

        verify(jdbc).update("UPDATE board_columns SET position = position - 1 WHERE project_id = ? AND position > ?",
                PROJECT, 2);
    }

    @Test
    void naoExcluiWorkspaceQueAindaContemProjetos() {
        when(jdbc.queryForObject(eq("SELECT COUNT(*) FROM workspaces WHERE id = ? AND owner_id = ?"),
                eq(Integer.class), eq(WORKSPACE), eq(OWNER))).thenReturn(1);
        when(jdbc.queryForObject(eq("SELECT COUNT(*) FROM projects WHERE workspace_id = ?"),
                eq(Integer.class), eq(WORKSPACE))).thenReturn(2);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.deleteWorkspace(WORKSPACE));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(jdbc, never()).update(eq("DELETE FROM workspaces WHERE id = ? AND owner_id = ?"),
                eq(WORKSPACE), eq(OWNER));
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void excluirTarefaReorganizaAsPosicoesRestantes() throws Exception {
        ownedProject();
        ResultSet row = mock(ResultSet.class);
        when(row.getObject("column_id", UUID.class)).thenReturn(COLUMN);
        when(row.getInt("position")).thenReturn(3);
        when(jdbc.query(eq("SELECT column_id, position FROM tasks WHERE id = ? AND project_id = ?"),
                any(RowMapper.class), eq(TASK), eq(PROJECT))).thenAnswer(invocation -> {
                    RowMapper mapper = invocation.getArgument(1);
                    return List.of(mapper.mapRow(row, 0));
                });
        when(jdbc.update(eq("DELETE FROM tasks WHERE id = ? AND project_id = ?"),
                eq(TASK), eq(PROJECT))).thenReturn(1);

        service.deleteTask(PROJECT, TASK);

        verify(jdbc).update("UPDATE tasks SET position = position - 1 WHERE project_id = ? AND column_id = ? AND position > ?",
                PROJECT, COLUMN, 3);
    }
}
