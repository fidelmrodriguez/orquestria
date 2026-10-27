package com.orquestria.api.team;

import com.orquestria.api.auth.AuthService;
import com.orquestria.api.auth.AppUser;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Diretório e equipe autenticados. Nenhum acesso a projetos é concedido aqui. */
@Service
public class TeamService {
    public record DirectoryUser(UUID id, String name, String username) {}

    private final JdbcTemplate jdbc;
    private final AuthService auth;

    public TeamService(JdbcTemplate jdbc, AuthService auth) {
        this.jdbc = jdbc;
        this.auth = auth;
    }

    private AppUser personalAccount() {
        AppUser user = auth.currentUser();
        if (user.getAccountType().name().equals("GUEST")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Use uma conta pessoal para gerenciar a equipe");
        }
        return user;
    }

    /** Busca usuários reais, sem revelar emails, tokens, senhas ou a conta pública guest. */
    @Transactional(readOnly = true)
    public List<DirectoryUser> search(String rawQuery) {
        UUID currentUserId = personalAccount().getId();
        String query = rawQuery == null ? "" : rawQuery.strip().replaceFirst("^@", "");
        if (query.length() < 2 || query.length() > 50) return List.of();
        String escaped = query.toLowerCase(java.util.Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return jdbc.query("""
            SELECT id, name, username FROM app_users
            WHERE account_type = 'USER' AND id <> ?
              AND (lower(name) LIKE ? ESCAPE '\\' OR lower(username) LIKE ? ESCAPE '\\')
            ORDER BY lower(name), lower(username) LIMIT 20
            """, (rs, i) -> new DirectoryUser(
                rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("username")),
                currentUserId, "%" + escaped + "%", "%" + escaped + "%");
    }

    @Transactional(readOnly = true)
    public List<DirectoryUser> members() {
        AppUser user = auth.currentUser();
        if (user.getAccountType().name().equals("GUEST")) return List.of();
        UUID owner = user.getId();
        return jdbc.query("""
            SELECT u.id, u.name, u.username FROM team_members tm
            JOIN app_users u ON u.id = tm.member_id
            WHERE tm.owner_id = ?
            ORDER BY lower(u.name), lower(u.username)
            """, (rs, i) -> new DirectoryUser(
                rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("username")), owner);
    }

    @Transactional
    public void add(UUID memberId) {
        UUID owner = personalAccount().getId();
        if (memberId == null || memberId.equals(owner)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione outro usuário");
        }
        Integer exists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM app_users WHERE id = ? AND account_type = 'USER'",
                Integer.class, memberId);
        if (exists == null || exists != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado");
        }
        int inserted = jdbc.update("""
            INSERT INTO team_members(owner_id, member_id) VALUES (?, ?)
            ON CONFLICT (owner_id, member_id) DO NOTHING
            """, owner, memberId);
        if (inserted != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este usuário já pertence à sua equipe");
        }
    }

    @Transactional
    public void remove(UUID memberId) {
        UUID owner = personalAccount().getId();
        Integer assignments = jdbc.queryForObject("""
            SELECT COUNT(*) FROM tasks t JOIN projects p ON p.id = t.project_id
            WHERE p.owner_id = ? AND t.assignee_id = ?
            """, Integer.class, owner, memberId.toString());
        if (assignments != null && assignments > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Reatribua as tarefas deste membro antes de removê-lo da equipe");
        }
        // Rota legada de remoção global: revoga também os acessos concedidos pelo proprietário.
        jdbc.update("""
            DELETE FROM project_members pm USING projects p
            WHERE pm.project_id = p.id AND p.owner_id = ? AND pm.member_id = ?
            """, owner, memberId);
        if (jdbc.update("DELETE FROM team_members WHERE owner_id = ? AND member_id = ?", owner, memberId) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado na sua equipe");
        }
    }
}
