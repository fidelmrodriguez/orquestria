package com.orquestria.api.workspace;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
    java.util.List<Workspace> findByOwner_IdOrderByCreatedAtDesc(java.util.UUID ownerId);
    java.util.Optional<Workspace> findByIdAndOwner_Id(java.util.UUID id,java.util.UUID ownerId);}
