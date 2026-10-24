package com.orquestria.api.workspace;

import com.orquestria.api.common.ResourceNotFoundException;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkspaceService {
    private final WorkspaceRepository repository;
    private final com.orquestria.api.auth.OwnershipGuard guard;
    public WorkspaceService(WorkspaceRepository repository,com.orquestria.api.auth.OwnershipGuard guard) {
        this.repository=repository;this.guard=guard;
    }
    @Transactional
    public WorkspaceResponse create(CreateWorkspaceRequest request) {
        String desc = request.description() == null ? null : request.description().trim();
        Workspace workspace=new Workspace(request.name().trim(),desc);
        workspace.setOwner(guard.current());
        return WorkspaceResponse.from(repository.save(workspace));
    }
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> list() {
        return repository.findByOwner_IdOrderByCreatedAtDesc(guard.current().getId()).stream().map(WorkspaceResponse::from).toList();
    }
    @Transactional(readOnly = true)
    public WorkspaceResponse findById(UUID id) {
        return WorkspaceResponse.from(repository.findByIdAndOwner_Id(id,guard.current().getId()).orElseThrow(() -> new ResourceNotFoundException("Workspace")));
    }
}
