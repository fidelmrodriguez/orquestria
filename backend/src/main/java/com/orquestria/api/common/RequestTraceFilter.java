package com.orquestria.api.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Identificador gerado pelo servidor; não utiliza valores enviados pelo cliente. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RequestTraceFilter extends OncePerRequestFilter {
    private static final Logger LOG = LoggerFactory.getLogger(RequestTraceFilter.class);
    public static final String HEADER = "X-Request-ID";
    public static final String MDC_KEY = "requestId";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !uri.startsWith("/api/") && !uri.equals("/actuator/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String requestId = UUID.randomUUID().toString();
        long start = System.nanoTime();
        String uri = request.getRequestURI();
        boolean failed = false;
        response.setHeader(HEADER, requestId);
        if (uri.startsWith("/api/")) {
            // Não guardar dados autenticados nem respostas de login em caches intermediários.
            response.setHeader("Cache-Control", "no-store, max-age=0");
            response.setHeader("Pragma", "no-cache");
        }
        // Os metadados são úteis no diagnóstico, sem tokens, parâmetros ou identificadores de usuários.
        MDC.put(MDC_KEY, requestId);
        try {
            chain.doFilter(request, response);
        } catch (ServletException | IOException | RuntimeException ex) {
            failed = true;
            throw ex;
        } finally {
            long elapsedMs = (System.nanoTime() - start) / 1_000_000;
            int status = failed ? 500 : response.getStatus();
            if (!uri.equals("/actuator/health")) {
                String family = uri.startsWith("/api/auth/") ? "auth"
                    : uri.startsWith("/api/projects") ? "projects"
                    : uri.startsWith("/api/workspaces") ? "workspaces"
                    : uri.startsWith("/api/team") ? "team"
                    : uri.startsWith("/api/tags") ? "tags" : "api";
                if (status >= 500) {
                    LOG.warn("http family={} method={} status={} durationMs={}",
                            family, request.getMethod(), status, elapsedMs);
                } else if (status >= 400 || elapsedMs >= 2000) {
                    LOG.info("http family={} method={} status={} durationMs={}",
                            family, request.getMethod(), status, elapsedMs);
                }
            }
            MDC.remove(MDC_KEY);
        }
    }
}
