package com.orquestria.api.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    private final String frontendOrigin;

    public CorsConfig(@Value("${APP_CORS_ALLOWED_ORIGIN:https://orquestria.netlify.app}") String frontendOrigin) {
        this.frontendOrigin = frontendOrigin;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(frontendOrigin)
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type")
                .maxAge(3600);
        registry.addMapping("/actuator/health")
                .allowedOrigins(frontendOrigin)
                .allowedMethods("GET", "OPTIONS")
                .maxAge(3600);
    }
}
