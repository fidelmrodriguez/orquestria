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
    @Mock private com.orquestria.api.auth.OwnershipGuard guard;
    @Mock private com.orquestria.api.auth.AppUser user;
    private ProjectService service;

    @BeforeEach
    void setup() {
        service = new ProjectService(repository, workspaces,guard);
        when(guard.current()).thenReturn(user);
        when(user.getId()).thenReturn(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
    }

    @Test
    void listReturnsProjectsWhenRepositoryIsEmpty() {
        when(repository.findByOwner_IdOrderByCreatedAtDesc(any())).thenReturn(java.util.List.of());

        assertEquals(0, service.list().size());
        verify(repository).findByOwner_IdOrderByCreatedAtDesc(any());
    }

    @Test
    void findByIdThrowsWhenProjectDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndOwner_Id(any(),any())).thenReturn(Optional.empty());

        assertThrows(ProjectNotFoundException.class, () -> service.findById(id));
    }
}
