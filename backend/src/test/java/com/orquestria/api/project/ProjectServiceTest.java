package com.orquestria.api.project;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.orquestria.api.workspace.WorkspaceRepository;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {
    @Mock
    private ProjectRepository repository;

    @Mock
    private WorkspaceRepository workspaces;
    private ProjectService service;

    @BeforeEach
    void setup() {
        service = new ProjectService(repository, workspaces);
    }

    @Test
    void listReturnsProjectsWhenRepositoryIsEmpty() {
        when(repository.findAll(any(Sort.class))).thenReturn(java.util.List.of());

        assertEquals(0, service.list().size());
        verify(repository).findAll(any(Sort.class));
    }

    @Test
    void findByIdThrowsWhenProjectDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ProjectNotFoundException.class, () -> service.findById(id));
    }
}
