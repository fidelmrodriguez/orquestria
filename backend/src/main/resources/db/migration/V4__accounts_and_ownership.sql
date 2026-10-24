-- Mantém workspaces, projetos e tarefas existentes: serão atribuídos ao guest no bootstrap.
CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    account_type VARCHAR(12) NOT NULL CHECK (account_type IN ('GUEST', 'USER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_users(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);
ALTER TABLE workspaces ADD COLUMN owner_id UUID REFERENCES app_users(id);
ALTER TABLE projects ADD COLUMN owner_id UUID REFERENCES app_users(id);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);
