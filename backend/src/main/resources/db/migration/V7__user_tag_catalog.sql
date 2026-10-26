-- Catálogo de tags exclusivo de cada usuário. Não altera as tags salvas em tarefas existentes.
CREATE TABLE IF NOT EXISTS user_tags (
    id UUID NOT NULL PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_tags_name_not_blank CHECK (length(btrim(name)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_tags_owner_lower_name ON user_tags(owner_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_user_tags_owner_id ON user_tags(owner_id);
