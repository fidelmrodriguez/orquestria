package com.orquestria.api.integration;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/** Verifica todas as migrações reais no Postgres temporário; JPA também valida o schema ao subir. */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "ORQUESTRIA_RUN_DB_TESTS", matches = "true")
class FlywayPostgresTest {
    @Autowired private Flyway flyway;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void appliesAllMigrationsFromV1ThroughV10() {
        Set<String> applied = Arrays.stream(flyway.info().applied())
                .filter(info -> info.getVersion() != null)
                .map(info -> info.getVersion().toString())
                .collect(Collectors.toSet());
        for (int version = 1; version <= 10; version++) {
            assertTrue(applied.contains(Integer.toString(version)), "Migração V" + version + " não aplicada");
        }
        assertNotNull(jdbc.queryForObject("SELECT COUNT(*) FROM app_users", Integer.class));
        assertNotNull(jdbc.queryForObject("SELECT COUNT(*) FROM team_members", Integer.class));
        assertNotNull(jdbc.queryForObject("SELECT COUNT(*) FROM project_members", Integer.class));
        assertNotNull(jdbc.queryForObject("SELECT COUNT(*) FROM user_tags", Integer.class));
        assertNotNull(jdbc.queryForObject("SELECT COUNT(last_active_at) FROM app_users", Long.class));
    }
}
