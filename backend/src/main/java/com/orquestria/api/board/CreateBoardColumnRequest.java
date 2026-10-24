package com.orquestria.api.board;
import jakarta.validation.constraints.*;
public record CreateBoardColumnRequest(
    @NotBlank @Size(max = 80) String title,
    @Min(0) @Max(10000) int position,
    @Size(max = 32) String color
) {}
