package com.orquestria.api.auth;
import com.orquestria.api.workspace.Workspace;
import com.orquestria.api.workspace.WorkspaceRepository;
import com.orquestria.api.project.Project;
import com.orquestria.api.project.ProjectRepository;
import com.orquestria.api.common.ResourceNotFoundException;
import java.util.UUID;
import org.springframework.stereotype.Component;
@Component
public class OwnershipGuard {
    private final AuthService auth;private final WorkspaceRepository workspaces;private final ProjectRepository projects;
    public OwnershipGuard(AuthService auth,WorkspaceRepository workspaces,ProjectRepository projects){
       this.auth=auth;this.workspaces=workspaces;this.projects=projects;
    }
    public AppUser current(){return auth.currentUser();}
    public Workspace workspace(UUID id){return workspaces.findByIdAndOwner_Id(id,current().getId())
       .orElseThrow(()->new ResourceNotFoundException("Workspace"));}
    public Project project(UUID id){return projects.findByIdAndOwner_Id(id,current().getId())
       .orElseThrow(()->new ResourceNotFoundException("Projeto"));}
}
