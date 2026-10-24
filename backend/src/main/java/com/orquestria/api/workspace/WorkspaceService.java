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
    public WorkspaceService(WorkspaceRepository repository) { this.repository = repository; }
    @Transactional
    public WorkspaceResponse create(CreateWorkspaceRequest request) {
        String desc = request.description() == null ? null : request.description().trim();
        return WorkspaceResponse.from(repository.save(new Workspace(request.name().trim(), desc)));
    }
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().map(WorkspaceResponse::from).toList();
    }
    @Transactional(readOnly = true)
    public WorkspaceResponse findById(UUID id) {
        return WorkspaceResponse.from(repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Workspace")));
    }
}
