package com.orquestria.api.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Exercita a API e o Flyway em um PostgreSQL REAL e descartável (GitHub Actions).
 * Nunca usa o banco Neon. Os testes ficam desabilitados fora do job de CI,
 * a menos que ORQUESTRIA_RUN_DB_TESTS=true seja informado explicitamente.
 */
@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "ORQUESTRIA_RUN_DB_TESTS", matches = "true")
class ApiSecurityPostgresTest {
    private static final String PASSWORD = "SenhaForteTeste123!";

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;

    private record User(String token, String username, String email, UUID id) {}

    private JsonNode call(MockHttpServletRequestBuilder request, int expectedStatus) throws Exception {
        MvcResult result = mvc.perform(request).andExpect(status().is(expectedStatus)).andReturn();
        String content = result.getResponse().getContentAsString();
        return content.isBlank() ? json.getNodeFactory().nullNode() : json.readTree(content);
    }

    private MockHttpServletRequestBuilder authenticated(MockHttpServletRequestBuilder request, User user) {
        return request.header("Authorization", "Bearer " + user.token());
    }

    private JsonNode postJson(String path, User user, Object payload, int expectedStatus) throws Exception {
        MockHttpServletRequestBuilder request = post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(payload));
        return call(user == null ? request : authenticated(request, user), expectedStatus);
    }

    private JsonNode getJson(String path, User user, int expectedStatus) throws Exception {
        MockHttpServletRequestBuilder request = get(path);
        return call(user == null ? request : authenticated(request, user), expectedStatus);
    }

    private User register(String prefix) throws Exception {
        String random = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String username = prefix + random;
        String email = username + "@example.test";
        JsonNode body = postJson("/api/auth/register", null,
                Map.of("name", "Usuário " + prefix, "username", username,
                        "email", email, "password", PASSWORD), 200);
        String token = body.path("token").asText();
        assertFalse(token.isBlank(), "Registro deve emitir token");
        return new User(token, username, email, UUID.fromString(body.path("id").asText()));
    }

    private String idOf(JsonNode node) {
        return node.path("id").asText();
    }

    private JsonNode createWorkspace(User user) throws Exception {
        return postJson("/api/workspaces", user,
                Map.of("name", "Workspace de integração", "description", "Descartável"), 201);
    }

    private JsonNode createProject(User user, String workspaceId) throws Exception {
        return postJson("/api/projects", user,
                Map.of("name", "Projeto de integração", "description", "Descartável",
                        "workspaceId", workspaceId), 201);
    }

    private JsonNode createColumn(User user, String projectId) throws Exception {
        return postJson("/api/projects/" + projectId + "/columns", user,
                Map.of("title", "A fazer", "position", 0, "color", "slate"), 201);
    }

    private JsonNode createTask(User user, String projectId, String columnId, String assigneeId,
                                int expectedStatus) throws Exception {
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("title", "Tarefa da integração");
        payload.put("columnId", columnId);
        payload.put("position", 0);
        payload.put("tags", java.util.List.of("qa"));
        if (assigneeId != null) payload.put("assigneeId", assigneeId);
        return postJson("/api/projects/" + projectId + "/tasks", user, payload, expectedStatus);
    }

    @Test
    void healthIsPublicButApiRequiresValidBearer() throws Exception {
        getJson("/actuator/health", null, 200);
        getJson("/api/workspaces", null, 401);
        call(get("/api/projects").header("Authorization", "Bearer invalid"), 401);
    }

    @Test
    void apiResponsesAreNonCacheableAndHaveServerGeneratedRequestIds() throws Exception {
        MvcResult result = mvc.perform(get("/api/workspaces"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")))
                .andExpect(header().exists("X-Request-ID"))
                .andReturn();
        assertFalse(result.getResponse().getHeader("X-Request-ID").isBlank());

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{json quebrado} segredo=nao_expor"))
                .andExpect(status().isBadRequest())
                .andExpect(header().exists("X-Request-ID"))
                .andExpect(jsonPath("$.detail").value("JSON inválido ou incompatível."));
    }

    @Test
    void registrationLoginAndLogoutWorkWithRealDatabase() throws Exception {
        User user = register("login");
        JsonNode byName = postJson("/api/auth/login", null,
                Map.of("identifier", user.username().toUpperCase(), "password", PASSWORD), 200);
        JsonNode byEmail = postJson("/api/auth/login", null,
                Map.of("identifier", user.email().toUpperCase(), "password", PASSWORD), 200);
        assertEquals(user.id().toString(), byName.path("id").asText());
        assertEquals(user.id().toString(), byEmail.path("id").asText());
        assertNotEquals(byName.path("token").asText(), byEmail.path("token").asText());
        assertEquals(user.email(), getJson("/api/auth/me", user, 200).path("email").asText());

        // Excluir uma sessão não deve invalidar as demais sessões da mesma conta.
        call(authenticated(post("/api/auth/logout"), user), 200);
        getJson("/api/auth/me", user, 401);
        call(get("/api/auth/me").header("Authorization", "Bearer " + byName.path("token").asText()), 200);
        postJson("/api/auth/login", null,
                Map.of("identifier", user.email(), "password", "senha-incorreta"), 401);
    }

    @Test
    void anotherAccountCannotReadOrDeletePrivateResources() throws Exception {
        User owner = register("owner");
        User other = register("other");
        String workspaceId = idOf(createWorkspace(owner));
        String projectId = idOf(createProject(owner, workspaceId));
        String columnId = idOf(createColumn(owner, projectId));
        String taskId = idOf(createTask(owner, projectId, columnId, null, 201));

        getJson("/api/workspaces/" + workspaceId, other, 404);
        getJson("/api/projects/" + projectId, other, 404);
        getJson("/api/projects/" + projectId + "/tasks", other, 404);
        assertFalse(getJson("/api/projects", other, 200).toString().contains(projectId));
        assertFalse(getJson("/api/workspaces", other, 200).toString().contains(workspaceId));

        call(authenticated(post("/api/projects/" + projectId + "/tasks/" + taskId + "/delete"), other), 404);
        call(authenticated(post("/api/projects/" + projectId + "/delete"), other), 404);
        call(authenticated(post("/api/workspaces/" + workspaceId + "/delete"), other), 404);

        // Regras de integridade testadas no HTTP + PostgreSQL, não apenas em mocks.
        call(authenticated(post("/api/projects/" + projectId + "/columns/" + columnId + "/delete"), owner), 409);
        call(authenticated(post("/api/workspaces/" + workspaceId + "/delete"), owner), 409);
        assertEquals(taskId, getJson("/api/projects/" + projectId + "/tasks", owner, 200)
                .get(0).path("id").asText());

        call(authenticated(post("/api/projects/" + projectId + "/tasks/" + taskId + "/delete"), owner), 204);
        call(authenticated(post("/api/projects/" + projectId + "/columns/" + columnId + "/delete"), owner), 204);
        call(authenticated(post("/api/projects/" + projectId + "/delete"), owner), 204);
        call(authenticated(post("/api/workspaces/" + workspaceId + "/delete"), owner), 204);
        getJson("/api/projects/" + projectId, owner, 404);
        getJson("/api/workspaces/" + workspaceId, owner, 404);
    }

    @Test
    void directoryMembersAndTagCatalogAreAccountScoped() throws Exception {
        User owner = register("teamowner");
        User member = register("teammate");
        User outsider = register("outsider");
        String projectId = idOf(createProject(owner, idOf(createWorkspace(owner))));
        String columnId = idOf(createColumn(owner, projectId));

        // Não é possível atribuir tarefas a quem não foi cadastrado na equipe.
        createTask(owner, projectId, columnId, member.id().toString(), 400);
        createTask(owner, projectId, columnId, outsider.id().toString(), 400);

        JsonNode found = getJson("/api/users/search?q=" + member.username().substring(0, 10), owner, 200);
        assertTrue(found.isArray());
        assertTrue(found.toString().contains(member.id().toString()));

        postJson("/api/team/members", owner, Map.of("userId", member.id().toString()), 204);
        postJson("/api/team/members", owner, Map.of("userId", member.id().toString()), 409);
        assertTrue(getJson("/api/team/members", owner, 200).toString().contains(member.id().toString()));
        assertFalse(getJson("/api/team/members", outsider, 200).toString().contains(member.id().toString()));

        String taskId = idOf(createTask(owner, projectId, columnId, member.id().toString(), 201));
        call(authenticated(post("/api/team/members/" + member.id() + "/remove"), owner), 409);
        call(authenticated(post("/api/projects/" + projectId + "/tasks/" + taskId + "/delete"), owner), 204);
        call(authenticated(post("/api/team/members/" + member.id() + "/remove"), owner), 204);
        assertFalse(getJson("/api/team/members", owner, 200).toString().contains(member.id().toString()));

        JsonNode tag = postJson("/api/tags", owner, Map.of("name", "Urgente"), 201);
        String tagId = idOf(tag);
        postJson("/api/tags", owner, Map.of("name", "urgente"), 409);
        assertTrue(getJson("/api/tags?q=urge", owner, 200).toString().contains("Urgente"));
        assertFalse(getJson("/api/tags", outsider, 200).toString().contains("Urgente"));
        call(authenticated(post("/api/tags/" + tagId + "/remove"), outsider), 404);
        postJson("/api/tags/" + tagId + "/rename", owner, Map.of("name", "Importante"), 200);
        assertTrue(getJson("/api/tags?q=Impor", owner, 200).toString().contains("Importante"));
        call(authenticated(post("/api/tags/" + tagId + "/remove"), owner), 204);
        assertFalse(getJson("/api/tags", owner, 200).toString().contains("Importante"));
    }
}
