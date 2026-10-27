-- Acesso concedido explicitamente a um projeto; não concede acesso ao workspace inteiro.
-- O proprietário é admin por definição e não precisa de registro nesta tabela.
-- Os membros são membro-admin somente nos projetos para os quais existe uma linha.
CREATE TABLE project_members (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, member_id)
);
CREATE INDEX idx_project_members_member ON project_members(member_id, project_id);
