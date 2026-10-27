package com.orquestria.api.common;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;

class RequestTraceFilterTest {
    private final RequestTraceFilter filter = new RequestTraceFilter();

    @Test
    void generatesServerSideCorrelationIdAndPreventsApiCaching() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/projects");
        request.addHeader("X-Request-ID", "forged-client-id");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> {
            assertNotNull(MDC.get(RequestTraceFilter.MDC_KEY));
            ((MockHttpServletResponse) res).setStatus(200);
        });

        String id = response.getHeader("X-Request-ID");
        assertNotNull(id);
        assertEquals(UUID.fromString(id).toString(), id);
        assertNotEquals("forged-client-id", id);
        assertEquals("no-store, max-age=0", response.getHeader("Cache-Control"));
        assertEquals("no-cache", response.getHeader("Pragma"));
        assertNull(MDC.get(RequestTraceFilter.MDC_KEY));
    }

    @Test
    void tracesFailuresWithoutLeavingMdcStateBehind() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/auth/login");
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> ((MockHttpServletResponse) res).setStatus(401));
        assertEquals(401, response.getStatus());
        assertNotNull(response.getHeader("X-Request-ID"));
        assertNull(MDC.get(RequestTraceFilter.MDC_KEY));
    }

    @Test
    void doesNotModifyUnrelatedStaticPaths() throws Exception {
        var request = new MockHttpServletRequest("GET", "/index.html");
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> {});
        assertNull(response.getHeader("X-Request-ID"));
        assertNull(response.getHeader("Cache-Control"));
    }
}
