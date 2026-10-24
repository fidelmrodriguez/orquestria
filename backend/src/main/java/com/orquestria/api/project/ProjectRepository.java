package com.orquestria.api.project;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    java.util.List<Project> findByOwner_IdOrderByCreatedAtDesc(UUID ownerId);
    java.util.Optional<Project> findByIdAndOwner_Id(UUID id, UUID ownerId);
}
