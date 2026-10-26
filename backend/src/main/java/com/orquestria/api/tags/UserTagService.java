package com.orquestria.api.tags;

import com.orquestria.api.auth.AppUser;
import com.orquestria.api.auth.AuthService;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Catálogo por conta; a conta Guest compartilha o catálogo demonstrativo. */
@Service
public class UserTagService {
    public record TagDto(UUID id, String name) {}

    private final JdbcTemplate jdbc;
    private final AuthService auth;
    public UserTagService(JdbcTemplate jdbc, AuthService auth) { this.jdbc = jdbc; this.auth = auth; }

    private UUID owner() {
        return auth.currentUser().getId();
    }

    private String safeName(String raw) {
        if (raw == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a tag");
        String name = raw.replace(",", " ").replaceAll("\\s+", " ").trim();
        if (name.length() < 1 || name.length() > 32)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A tag precisa ter de 1 a 32 caracteres");
        return name;
    }

    private List<TagDto> searchByOwner(UUID owner, String term) {
        String query = term.strip().toLowerCase(Locale.ROOT);
        if (query.length() > 50) return List.of();
        String escaped = query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return jdbc.query("SELECT id, name FROM user_tags WHERE owner_id = ? " +
                "AND lower(name) LIKE ? ESCAPE '\\' ORDER BY lower(name) LIMIT 100",
            (rs, i) -> new TagDto(rs.getObject("id", UUID.class), rs.getString("name")),
            owner, "%" + escaped + "%");
    }

    @Transactional(readOnly = true)
    public List<TagDto> search(String query) {
        return searchByOwner(owner(), query == null ? "" : query);
    }

    @Transactional
    public TagDto add(String rawName) {
        UUID owner = owner();
        String name = safeName(rawName);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM user_tags WHERE owner_id = ?", Integer.class, owner);
        if (count != null && count >= 100)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Limite de 100 tags por conta");
        UUID id = UUID.randomUUID();
        try {
            jdbc.update("INSERT INTO user_tags(id, owner_id, name) VALUES (?, ?, ?)", id, owner, name);
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tag já cadastrada");
        }
        return new TagDto(id, name);
    }

    @Transactional
    public TagDto rename(UUID id, String rawName) {
        UUID owner = owner();
        String name = safeName(rawName);
        try {
            int changed = jdbc.update("UPDATE user_tags SET name = ? WHERE id = ? AND owner_id = ?", name, id, owner);
            if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tag não encontrada");
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma tag com esse nome");
        }
        return new TagDto(id, name);
    }

    @Transactional
    public void remove(UUID id) {
        int deleted = jdbc.update("DELETE FROM user_tags WHERE id = ? AND owner_id = ?", id, owner());
        if (deleted == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tag não encontrada");
    }
}
