package com.orquestria.api.collaboration;

import com.orquestria.api.auth.AppUser;
import com.orquestria.api.auth.OwnershipGuard;
import com.orquestria.api.project.Project;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Permissões por projeto: admin (dono) ou membro-admin (associação explícita). */
@Service
public class ProjectMembershipService {
    public record Member(UUID id, String name, String username, String role) {}
    public record InvitedProject(UUID id, String name, String description, Instant createdAt,
                                 UUID workspaceId, String workspaceName, String ownerName, String role) {}

    private final OwnershipGuard guard;
    private final JdbcTemplate jdbc;

    public ProjectMembershipService(OwnershipGuard guard, JdbcTemplate jdbc) {
        this.guard = guard;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<InvitedProject> invited() {
        AppUser user = guard.current();
        return jdbc.query("""
            SELECT p.id, p.name, p.description, p.created_at, p.workspace_id,
                   w.name AS workspace_name, owner.name AS owner_name
            FROM project_members pm
            JOIN projects p ON p.id = pm.project_id
            JOIN app_users owner ON owner.id = p.owner_id
            LEFT JOIN workspaces w ON w.id = p.workspace_id
            WHERE pm.member_id = ? AND p.owner_id <> ?
            ORDER BY lower(coalesce(w.name, 'Projetos sem workspace')), lower(p.name), p.id
            """, (rs, index) -> new InvitedProject(
                rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("description"),
                rs.getTimestamp("created_at").toInstant(), rs.getObject("workspace_id", UUID.class),
                rs.getString("workspace_name"), rs.getString("owner_name"), "membro-admin"),
            user.getId(), user.getId());
    }

    @Transactional(readOnly = true)
    public List<Member> members(UUID projectId) {
        Project project = guard.project(projectId);
        List<Member> list = new java.util.ArrayList<>();
        AppUser owner = project.getOwner();
        list.add(new Member(owner.getId(), owner.getName(), owner.getUsername(), "admin"));
        list.addAll(jdbc.query("""
            SELECT u.id, u.name, u.username FROM project_members pm
            JOIN app_users u ON u.id = pm.member_id
            WHERE pm.project_id = ? ORDER BY lower(u.name), lower(u.username)
            """, (rs, index) -> new Member(rs.getObject("id", UUID.class),
                rs.getString("name"), rs.getString("username"), "membro-admin"), projectId));
        return list;
    }

    @Transactional
    public void add(UUID projectId, UUID memberId) {
        Project project = guard.ownedProject(projectId); // membro-admin nunca pode convidar
        if (project.getOwner().getAccountType() != com.orquestria.api.auth.AccountType.USER)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "O ambiente Guest não permite colaboradores pessoais");
        UUID ownerId = project.getOwner().getId();
        if (memberId == null || ownerId.equals(memberId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione outro usuário");
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM app_users WHERE id = ? AND account_type = 'USER'",
            Integer.class, memberId);
        if (count == null || count != 1)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado");
        int inserted = jdbc.update("""
            INSERT INTO project_members(project_id, member_id) VALUES (?, ?)
            ON CONFLICT (project_id, member_id) DO NOTHING
            """, projectId, memberId);
        if (inserted == 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuário já participa deste projeto");
        // Mantém as validações legadas de atribuição de responsável do proprietário.
        jdbc.update("""
            INSERT INTO team_members(owner_id, member_id) VALUES (?, ?)
            ON CONFLICT (owner_id, member_id) DO NOTHING
            """, ownerId, memberId);
    }

    @Transactional
    public void remove(UUID projectId, UUID memberId) {
        Project project = guard.ownedProject(projectId); // não basta esconder botões na UI
        Integer assigned = jdbc.queryForObject("""
            SELECT COUNT(*) FROM tasks WHERE project_id = ? AND assignee_id = ?
            """, Integer.class, projectId, memberId.toString());
        if (assigned != null && assigned > 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Reatribua as tarefas deste membro antes de removê-lo do projeto");
        if (jdbc.update("DELETE FROM project_members WHERE project_id = ? AND member_id = ?", projectId, memberId) != 1)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado neste projeto");
        // A lista global de responsáveis continua válida para outros projetos do mesmo dono.
    }
}
