package com.orquestria.api.project;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {
    private final ProjectRepository repository;

    public ProjectService(ProjectRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest request) {
        String name = request.name().trim();
        String description = request.description() == null ? null : request.description().trim();
        Project project = repository.save(new Project(name, description));
        return ProjectResponse.from(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id) {
        Project project = repository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));
        return ProjectResponse.from(project);
    }
}
