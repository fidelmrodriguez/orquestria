package com.orquestria.api.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.orquestria.api.board.BoardColumn;
import com.orquestria.api.project.Project;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class TaskDomainTest {
    @Test
    void mantemDetalhesEComentariosEmMemoria() {
        Project projeto = new Project("Projeto exemplo", null);
        BoardColumn coluna = new BoardColumn(projeto, "Backlog", 0, "slate");
        Task tarefa = new Task(projeto, coluna, "Tarefa exemplo", "Descrição inicial",
            TaskPriority.MEDIA, 0, null);

        tarefa.setDetails("Tarefa atualizada", "Descrição revisada", TaskPriority.ALTA,
            LocalDate.of(2026, 11, 5), "member-current-user", List.of("API", "Java"));
        tarefa.addComment("member-current-user", "Comentário de teste");

        assertEquals("Tarefa atualizada", tarefa.getTitle());
        assertEquals(TaskPriority.ALTA, tarefa.getPriority());
        assertEquals(List.of("API", "Java"), tarefa.getTags());
        assertEquals("member-current-user", tarefa.getAssigneeId());
        assertEquals(1, tarefa.getComments().size());
        assertEquals("Comentário de teste", tarefa.getComments().get(0).getMessage());
        assertTrue(tarefa.getComments().get(0).getId() == null);
    }
}
