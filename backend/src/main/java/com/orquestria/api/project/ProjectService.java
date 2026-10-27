package com.orquestria.api.project;

import com.orquestria.api.common.ResourceNotFoundException;
import com.orquestria.api.workspace.Workspace;
import com.orquestria.api.workspace.WorkspaceRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {
    private final ProjectRepository repository;
    private final WorkspaceRepository workspaces;
    private final com.orquestria.api.auth.OwnershipGuard guard;
    public ProjectService(ProjectRepository repository, WorkspaceRepository workspaces,
                          com.orquestria.api.auth.OwnershipGuard guard) {
        this.repository=repository;this.workspaces=workspaces;this.guard=guard;
    }
    @Transactional
    public ProjectResponse create(CreateProjectRequest request) {
        String description = request.description() == null ? null : request.description().trim();
        Project project = new Project(request.name().trim(), description);
        project.setOwner(guard.current());
        if (request.workspaceId() != null) {
            Workspace workspace = guard.workspace(request.workspaceId());
            project.setWorkspace(workspace);
        }
        return ProjectResponse.from(repository.save(project));
    }
    @Transactional
    public ProjectResponse rename(UUID id, RenameProjectRequest request) {
        Project project = guard.project(id);
        project.rename(request.name().trim());
        return ProjectResponse.from(project);
    }
    @Transactional(readOnly = true)
    public List<ProjectResponse> list() {
        return repository.findByOwner_IdOrderByCreatedAtDesc(guard.current().getId())
            .stream().map(ProjectResponse::from).toList();
    }
    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id) {
        return ProjectResponse.from(guard.project(id));
    }
}
