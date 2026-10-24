package com.orquestria.api.auth;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.orquestria.api.common.ResourceNotFoundException;
import com.orquestria.api.project.ProjectRepository;
import com.orquestria.api.workspace.WorkspaceRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OwnershipGuardTest {
    @Test
    void deniesAccessToProjectOwnedByAnotherUser() {
        var auth=mock(AuthService.class);
        var workspaces=mock(WorkspaceRepository.class);
        var projects=mock(ProjectRepository.class);
        var user=mock(AppUser.class);
        var ownerId=UUID.randomUUID();
        var otherProjectId=UUID.randomUUID();
        when(auth.currentUser()).thenReturn(user);
        when(user.getId()).thenReturn(ownerId);
        when(projects.findByIdAndOwner_Id(otherProjectId,ownerId)).thenReturn(Optional.empty());
        var guard=new OwnershipGuard(auth,workspaces,projects);
        assertThrows(ResourceNotFoundException.class, ()->guard.project(otherProjectId));
        verify(projects,never()).findById(otherProjectId);
    }
}
