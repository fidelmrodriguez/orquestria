-- Mantém a tabela projects e o projeto já salvo no Neon.
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE projects
  ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);

CREATE TABLE board_columns (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(80) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(32) NOT NULL DEFAULT 'slate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_board_columns_project_position ON board_columns(project_id, position, id);

CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES board_columns(id),
  title VARCHAR(180) NOT NULL,
  description VARCHAR(2000),
  priority VARCHAR(16) NOT NULL DEFAULT 'MEDIA',
  position INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tasks_project_column_position ON tasks(project_id, column_id, position, id);
