package com.orquestria.api.auth;
import java.util.List;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
@Configuration
public class SecurityConfig {
    @Bean FilterRegistrationBean<BearerTokenFilter> disableServletRegistration(BearerTokenFilter filter) {
        var registration=new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder(10);}
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http,BearerTokenFilter tokenFilter) throws Exception {
        return http.csrf(AbstractHttpConfigurer::disable).cors(Customizer.withDefaults())
          .sessionManagement(sm->sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .authorizeHttpRequests(a->a
              .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll()
              .requestMatchers("/api/auth/login","/api/auth/register","/actuator/health").permitAll()
              .requestMatchers("/api/**").authenticated()
              .anyRequest().denyAll())
          .exceptionHandling(e->e.authenticationEntryPoint((req,res,ex)->res.sendError(HttpStatus.UNAUTHORIZED.value())))
          .addFilterBefore(tokenFilter,UsernamePasswordAuthenticationFilter.class).build();
    }
    @Bean CorsConfigurationSource corsConfigurationSource(
      @Value("${APP_CORS_ALLOWED_ORIGIN:https://orquestria.netlify.app}") String origin){
        var cors=new CorsConfiguration();
        cors.setAllowedOrigins(List.of(origin));
        cors.setAllowedMethods(List.of("GET","POST","PATCH","PUT","OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization","Content-Type"));
        cors.setExposedHeaders(List.of("X-Request-ID"));
        cors.setMaxAge(3600L);
        var source=new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",cors);return source;
    }
}
