package com.orquestria.api.common;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class ApiExceptionHandlerTest {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void expectedHttpErrorsPreserveStatusAndUsefulMessage() {
        var response = handler.handleExpectedResponseStatus(
                new ResponseStatusException(HttpStatus.CONFLICT, "Coluna possui tarefas"));
        assertEquals(409, response.getStatus());
        assertEquals("Coluna possui tarefas", response.getDetail());
    }

    @Test
    void unexpectedErrorsNeverExposeDatabaseDetails() {
        MDC.put(RequestTraceFilter.MDC_KEY, "test-request-id");
        try {
            var response = handler.handleUnexpected(
                    new IllegalStateException("jdbc:postgresql://private-host senha=secreta"));
            assertEquals(500, response.getStatus());
            assertFalse(response.getDetail().contains("secreta"));
            assertFalse(response.getDetail().contains("jdbc:"));
            assertEquals("test-request-id", response.getProperties().get("requestId"));
        } finally {
            MDC.remove(RequestTraceFilter.MDC_KEY);
        }
    }
}
