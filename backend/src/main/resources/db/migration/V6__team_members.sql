-- Cada usuário mantém uma lista particular de membros da sua equipe.
-- IMPORTANTE: cadastrar um membro aqui NÃO concede acesso aos projetos;
-- compartilhamento/autorização exigem uma etapa explícita e separada.
CREATE TABLE IF NOT EXISTS team_members (
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (owner_id, member_id),
  CONSTRAINT team_members_not_self CHECK (owner_id <> member_id)
);
CREATE INDEX IF NOT EXISTS idx_team_members_member_id ON team_members(member_id);
