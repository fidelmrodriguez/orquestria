-- Metadados do frontend e comentários persistidos sem apagar tarefas existentes.
ALTER TABLE tasks ADD COLUMN assignee_id VARCHAR(160);
ALTER TABLE tasks ADD COLUMN tags_csv VARCHAR(1000) NOT NULL DEFAULT '';

CREATE TABLE task_comments (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id VARCHAR(160) NOT NULL,
  message VARCHAR(2000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_task_comments_task_created ON task_comments(task_id, created_at);
