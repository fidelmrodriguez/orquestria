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
    public ProjectService(ProjectRepository repository, WorkspaceRepository workspaces) {
        this.repository = repository;
        this.workspaces = workspaces;
    }
    @Transactional
    public ProjectResponse create(CreateProjectRequest request) {
        String description = request.description() == null ? null : request.description().trim();
        Project project = new Project(request.name().trim(), description);
        if (request.workspaceId() != null) {
            Workspace workspace = workspaces.findById(request.workspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace"));
            project.setWorkspace(workspace);
        }
        return ProjectResponse.from(repository.save(project));
    }
    @Transactional
    public ProjectResponse rename(UUID id, RenameProjectRequest request) {
        Project project = repository.findById(id).orElseThrow(() -> new ProjectNotFoundException(id));
        project.rename(request.name().trim());
        return ProjectResponse.from(project);
    }
    @Transactional(readOnly = true)
    public List<ProjectResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
            .stream().map(ProjectResponse::from).toList();
    }
    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id) {
        return ProjectResponse.from(repository.findById(id).orElseThrow(() -> new ProjectNotFoundException(id)));
    }
}
