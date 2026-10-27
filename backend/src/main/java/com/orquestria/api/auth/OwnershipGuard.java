package com.orquestria.api.auth;

import com.orquestria.api.workspace.Workspace;
import com.orquestria.api.workspace.WorkspaceRepository;
import com.orquestria.api.project.Project;
import com.orquestria.api.project.ProjectRepository;
import com.orquestria.api.common.ResourceNotFoundException;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Confere acesso por projeto, sem conceder acesso implícito ao workspace. */
@Component
public class OwnershipGuard {
    private final AuthService auth;
    private final WorkspaceRepository workspaces;
    private final ProjectRepository projects;
    private final JdbcTemplate jdbc;

    public OwnershipGuard(AuthService auth, WorkspaceRepository workspaces, ProjectRepository projects, JdbcTemplate jdbc) {
        this.auth = auth;
        this.workspaces = workspaces;
        this.projects = projects;
        this.jdbc = jdbc;
    }

    public AppUser current() { return auth.currentUser(); }

    /** Somente o dono administra o workspace ou gerencia membros. */
    public Workspace workspace(UUID id) {
        return workspaces.findByIdAndOwner_Id(id, current().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Workspace"));
    }

    /** Acesso ao projeto se proprietário (admin) ou membro-admin explícito. */
    public Project project(UUID id) {
        UUID accountId = current().getId();
        Project project = projects.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Projeto"));
        if (project.getOwner() != null && project.getOwner().getId().equals(accountId)) return project;
        Integer member = jdbc.queryForObject(
            "SELECT COUNT(*) FROM project_members WHERE project_id = ? AND member_id = ?",
            Integer.class, id, accountId);
        if (member != null && member > 0) return project;
        throw new ResourceNotFoundException("Projeto");
    }

    public Project ownedProject(UUID id) {
        return projects.findByIdAndOwner_Id(id, current().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Projeto"));
    }
}
