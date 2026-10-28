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
    void duplicatedTaskGetsNewIdsAndIsInsertedImmediatelyAfterOriginal() throws Exception {
        User owner = register("duplicate");
        User outsider = register("duplicaterejected");
        String workspaceId = idOf(createWorkspace(owner));
        String projectId = idOf(createProject(owner, workspaceId));
        String columnId = idOf(createColumn(owner, projectId));
        String endpoint = "/api/projects/" + projectId + "/tasks";
        JsonNode original = postJson(endpoint, owner, Map.of(
            "title", "Tarefa com dados", "description", "Descrição duplicada",
            "columnId", columnId, "priority", "ALTA", "position", 0,
            "assigneeId", owner.id().toString(), "tags", java.util.List.of("backend", "qa"),
            "dueDate", "2026-11-15"), 201);
        String originalId = idOf(original);
        String nextId = idOf(postJson(endpoint, owner, Map.of(
            "title", "Próxima tarefa", "columnId", columnId, "position", 1), 201));
        JsonNode withComment = postJson(endpoint + "/" + originalId + "/comments", owner,
            Map.of("authorId", owner.id().toString(), "message", "Comentário original"), 200);
        String originalComment = idOf(withComment.path("comments").get(0));
        assertEquals(owner.id().toString(), getJson("/api/auth/me", owner, 200).path("id").asText());
        // O mesmo Bearer aceito em /me deve autorizar a duplicação; sem Bearer, deve ser 401.
        postJson(endpoint + "/" + originalId + "/duplicate", null, Map.of(), 401);
        JsonNode duplicated = postJson(endpoint + "/" + originalId + "/duplicate", owner, Map.of(), 201);
        assertEquals(owner.id().toString(), getJson("/api/auth/me", owner, 200).path("id").asText());
        assertNotEquals(originalId, idOf(duplicated));
        assertEquals(original.path("title"), duplicated.path("title"));
        assertEquals(original.path("description"), duplicated.path("description"));
        assertEquals(original.path("priority"), duplicated.path("priority"));
        assertEquals(original.path("assigneeId"), duplicated.path("assigneeId"));
        assertEquals(original.path("tags"), duplicated.path("tags"));
        assertEquals(original.path("dueDate"), duplicated.path("dueDate"));
        assertEquals(1, duplicated.path("comments").size());
        assertNotEquals(originalComment, idOf(duplicated.path("comments").get(0)));
        assertEquals("Comentário original", duplicated.path("comments").get(0).path("message").asText());
        JsonNode ordered = getJson(endpoint, owner, 200);
        assertEquals(java.util.List.of(originalId, idOf(duplicated), nextId),
            java.util.List.of(idOf(ordered.get(0)), idOf(ordered.get(1)), idOf(ordered.get(2))));
        for (int i = 0; i < ordered.size(); i++) assertEquals(i, ordered.get(i).path("position").asInt());
        postJson(endpoint + "/" + originalId + "/duplicate", outsider, Map.of(), 404);
    }

    @Test
    void taskOrderIsPersistedWhenReorderingWithinAndAcrossColumns() throws Exception {
        User user = register("reorder");
        String workspaceId = idOf(createWorkspace(user));
        String projectId = idOf(createProject(user, workspaceId));
        String first = idOf(createColumn(user, projectId));
        String second = idOf(createColumn(user, projectId));
        String endpoint = "/api/projects/" + projectId + "/tasks";
        String a = idOf(postJson(endpoint, user, Map.of("title", "A", "columnId", first, "position", 0), 201));
        String b = idOf(postJson(endpoint, user, Map.of("title", "B", "columnId", first, "position", 1), 201));
        String c = idOf(postJson(endpoint, user, Map.of("title", "C", "columnId", first, "position", 2), 201));
        postJson(endpoint + "/" + c + "/move", user, Map.of("columnId", first, "position", 0), 200);
        JsonNode ordered = getJson(endpoint, user, 200);
        assertEquals(java.util.List.of(c, a, b), java.util.List.of(
            ordered.get(0).path("id").asText(), ordered.get(1).path("id").asText(), ordered.get(2).path("id").asText()));
        for (int index = 0; index < 3; index++) assertEquals(index, ordered.get(index).path("position").asInt());

        postJson(endpoint + "/" + a + "/move", user, Map.of("columnId", second, "position", 0), 200);
        JsonNode moved = getJson(endpoint, user, 200);
        java.util.List<String> original = new java.util.ArrayList<>();
        java.util.List<Integer> positions = new java.util.ArrayList<>();
        for (JsonNode task : moved) {
            if (task.path("columnId").asText().equals(first)) {
                original.add(task.path("id").asText());
                positions.add(task.path("position").asInt());
            } else if (task.path("id").asText().equals(a)) {
                assertEquals(second, task.path("columnId").asText());
                assertEquals(0, task.path("position").asInt());
            }
        }
        assertEquals(java.util.List.of(c, b), original);
        assertEquals(java.util.List.of(0, 1), positions);
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

        // Estar na equipe global não deve permitir atribuição fora do projeto compartilhado.
        createTask(owner, projectId, columnId, member.id().toString(), 400);
        postJson("/api/projects/" + projectId + "/members", owner,
                Map.of("userId", member.id().toString()), 204);
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
    @Test
    void memberAdminCanWorkOnlyOnExplicitlySharedProjectAndCannotManageMembers() throws Exception {
        User admin = register("collabadmin");
        User invited = register("collabmember");
        User outsider = register("collabother");
        String workspaceId = idOf(createWorkspace(admin));
        String sharedId = idOf(createProject(admin, workspaceId));
        String privateId = idOf(createProject(admin, workspaceId));
        String columnId = idOf(createColumn(admin, sharedId));

        getJson("/api/projects/" + sharedId, invited, 404);
        getJson("/api/projects/" + sharedId + "/tasks", invited, 404);
        postJson("/api/projects/" + sharedId + "/members", invited,
                Map.of("userId", outsider.id().toString()), 404);

        postJson("/api/projects/" + sharedId + "/members", admin,
                Map.of("userId", invited.id().toString()), 204);
        postJson("/api/projects/" + sharedId + "/members", admin,
                Map.of("userId", invited.id().toString()), 409);
        JsonNode visible = getJson("/api/projects/invited", invited, 200);
        assertEquals(1, visible.size());
        assertEquals(sharedId, visible.get(0).path("id").asText());
        assertEquals("membro-admin", visible.get(0).path("role").asText());
        assertTrue(getJson("/api/projects/invited", outsider, 200).isEmpty());
        assertEquals(0, getJson("/api/workspaces", invited, 200).size());
        getJson("/api/workspaces/" + workspaceId, invited, 404);
        getJson("/api/projects/" + privateId, invited, 404);
        getJson("/api/projects/" + privateId + "/columns", invited, 404);
        assertFalse(getJson("/api/projects", invited, 200).toString().contains(privateId));
        JsonNode team = getJson("/api/projects/" + sharedId + "/members", invited, 200);
        assertEquals(2, team.size());
        assertEquals("admin", team.get(0).path("role").asText());
        assertEquals("membro-admin", team.get(1).path("role").asText());

        String taskId = idOf(createTask(invited, sharedId, columnId, invited.id().toString(), 201));
        String otherColumn = idOf(createColumn(admin, privateId));
        createTask(admin, privateId, otherColumn, invited.id().toString(), 400);
        String spareColumn = idOf(createColumn(invited, sharedId));
        call(authenticated(post("/api/projects/" + sharedId + "/columns/" + spareColumn + "/delete"), invited), 204);
        postJson("/api/projects/" + sharedId + "/members", invited,
                Map.of("userId", outsider.id().toString()), 404);
        call(authenticated(post("/api/projects/" + sharedId + "/members/" + invited.id() + "/remove"), invited), 404);
        postJson("/api/projects/" + sharedId + "/rename", invited, Map.of("name", "Renomeado"), 200);
        call(authenticated(post("/api/projects/" + sharedId + "/tasks/" + taskId + "/delete"), invited), 204);
        call(authenticated(post("/api/projects/" + sharedId + "/members/" + invited.id() + "/remove"), admin), 204);
        getJson("/api/projects/" + sharedId, invited, 404);
        assertEquals(0, getJson("/api/projects/invited", invited, 200).size());
        getJson("/api/projects/" + sharedId, admin, 200);
    }

    @Test
    void commentsCanBeDeletedOnlyThroughTheirOwnTaskAndProject() throws Exception {
        User owner = register("commentowner");
        User other = register("commentother");
        String projectId = idOf(createProject(owner, idOf(createWorkspace(owner))));
        String columnId = idOf(createColumn(owner, projectId));
        String taskId = idOf(createTask(owner, projectId, columnId, owner.id().toString(), 201));
        String base = "/api/projects/" + projectId + "/tasks/" + taskId;
        JsonNode withComment = postJson(base + "/comments", owner,
                Map.of("authorId", owner.id().toString(), "message", "Comentário para remover"), 200);
        assertEquals(1, withComment.path("comments").size());
        String commentId = withComment.path("comments").get(0).path("id").asText();
        call(authenticated(post(base + "/comments/" + commentId + "/delete"), other), 404);
        assertEquals(1, getJson("/api/projects/" + projectId + "/tasks", owner, 200).get(0).path("comments").size());
        call(authenticated(post(base + "/comments/" + UUID.randomUUID() + "/delete"), owner), 404);
        JsonNode deleted = call(authenticated(post(base + "/comments/" + commentId + "/delete"), owner), 200);
        assertEquals(0, deleted.path("comments").size());
        assertEquals(0, getJson("/api/projects/" + projectId + "/tasks", owner, 200).get(0).path("comments").size());
    }
}
