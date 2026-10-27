package com.orquestria.api.auth;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class BearerTokenFilter extends OncePerRequestFilter {
    private final AuthSessionRepository sessions;
    private final JdbcTemplate jdbc;
    public BearerTokenFilter(AuthSessionRepository sessions, JdbcTemplate jdbc) {
        this.sessions = sessions;
        this.jdbc = jdbc;
    }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)
          throws IOException, ServletException {
        String header=request.getHeader("Authorization");
        if(header!=null && header.startsWith("Bearer ") && header.length()<512) {
            String token=header.substring(7);
            sessions.findByTokenHashAndExpiresAtAfter(AuthService.hash(token),Instant.now()).ifPresent(session -> {
                // No máximo uma escrita diária por usuário ativo, mesmo com muitos requests.
                // A marcação de exclusão é cancelada ao detectar nova atividade real.
                jdbc.update("""
                    UPDATE app_users SET last_active_at = CURRENT_TIMESTAMP,
                                         cleanup_candidate_since = NULL
                    WHERE id = ? AND (last_active_at < CURRENT_TIMESTAMP - INTERVAL '1 day'
                          OR cleanup_candidate_since IS NOT NULL)
                    """, session.getUser().getId());
                var principal=session.getUser().getId().toString();
                SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal,null,List.of()));
            });
        }
        chain.doFilter(request,response);
    }
}
