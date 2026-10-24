package com.orquestria.api.board;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

/** Verifica que os aliases POST usam o mesmo serviço protegido dos DELETE. */
class BoardDeletionControllerTest {
    private final BoardDeletionService service = mock(BoardDeletionService.class);
    private final BoardDeletionController controller = new BoardDeletionController(service);
    private final UUID projectId = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private final UUID taskId = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private final UUID columnId = UUID.fromString("00000000-0000-0000-0000-000000000004");
    private final UUID workspaceId = UUID.fromString("00000000-0000-0000-0000-000000000005");

    @Test
    void postParaExcluirTarefaUsaServicoExistente() {
        assertEquals(HttpStatus.NO_CONTENT, controller.deleteTaskViaPost(projectId, taskId).getStatusCode());
        verify(service).deleteTask(projectId, taskId);
    }

    @Test
    void postParaExcluirColunaUsaServicoExistente() {
        assertEquals(HttpStatus.NO_CONTENT, controller.deleteColumnViaPost(projectId, columnId).getStatusCode());
        verify(service).deleteColumn(projectId, columnId);
    }

    @Test
    void postParaExcluirProjetoUsaServicoExistente() {
        assertEquals(HttpStatus.NO_CONTENT, controller.deleteProjectViaPost(projectId).getStatusCode());
        verify(service).deleteProject(projectId);
    }

    @Test
    void postParaExcluirWorkspaceUsaServicoExistente() {
        assertEquals(HttpStatus.NO_CONTENT, controller.deleteWorkspaceViaPost(workspaceId).getStatusCode());
        verify(service).deleteWorkspace(workspaceId);
    }
}
