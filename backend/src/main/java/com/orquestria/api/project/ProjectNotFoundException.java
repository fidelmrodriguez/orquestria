package com.orquestria.api.project;

import java.util.UUID;

public class ProjectNotFoundException extends RuntimeException {
    public ProjectNotFoundException(UUID id) {
        super("Projeto não encontrado: " + id);
    }
}
