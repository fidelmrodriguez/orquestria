package com.orquestria.api.auth;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class BearerTokenFilter extends OncePerRequestFilter {
    private static final Logger LOG = LoggerFactory.getLogger(BearerTokenFilter.class);
    private final AuthSessionRepository sessions;
    private final JdbcTemplate jdbc;
    public BearerTokenFilter(AuthSessionRepository sessions, JdbcTemplate jdbc) {
        this.sessions = sessions;
        this.jdbc = jdbc;
    }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)
          throws IOException, ServletException {
        String header = request.getHeader("Authorization");
        // Diagnóstico restrito à duplicação, sem logar URL, IDs, tokens ou informações pessoais.
        boolean duplicateRequest = "POST".equals(request.getMethod())
            && request.getRequestURI().startsWith("/api/projects/")
            && request.getRequestURI().endsWith("/duplicate");
        String bearerStatus = "ausente_ou_malformado";
        if (header != null && header.startsWith("Bearer ") && header.length() < 512) {
            String token = header.substring(7);
            var session = sessions.findByTokenHashAndExpiresAtAfter(AuthService.hash(token), Instant.now());
            bearerStatus = session.isPresent() ? "valido" : "invalido_revogado_ou_expirado";
            session.ifPresent(activeSession -> {
                // No máximo uma escrita diária por usuário ativo, mesmo com muitos requests.
                // A marcação de exclusão é cancelada ao detectar nova atividade real.
                jdbc.update("""
                    UPDATE app_users SET last_active_at = CURRENT_TIMESTAMP,
                                         cleanup_candidate_since = NULL
                    WHERE id = ? AND (last_active_at < CURRENT_TIMESTAMP - INTERVAL '1 day'
                          OR cleanup_candidate_since IS NOT NULL)
                    """, activeSession.getUser().getId());
                var principal = activeSession.getUser().getId().toString();
                SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal, null, List.of()));
            });
        }
        if (duplicateRequest) {
            // O RequestTraceFilter associa o log ao X-Request-ID por MDC.
            LOG.info("[Orquestria][auth] duplicacao_tarefa bearer={}", bearerStatus);
        }
        chain.doFilter(request, response);
    }
}
