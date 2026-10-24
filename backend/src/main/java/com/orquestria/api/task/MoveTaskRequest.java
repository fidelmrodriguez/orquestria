package com.orquestria.api.task;
import jakarta.validation.constraints.*;
import java.util.UUID;
public record MoveTaskRequest(@NotNull UUID columnId, @Min(0) @Max(100000) int position) {}
