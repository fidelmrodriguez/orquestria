package com.orquestria.api.board;
import java.util.UUID;
public record BoardColumnResponse(UUID id, UUID projectId, String title, int position, String color) {
    public static BoardColumnResponse from(BoardColumn column) {
        return new BoardColumnResponse(column.getId(), column.getProject().getId(),
            column.getTitle(), column.getPosition(), column.getColor());
    }
}
