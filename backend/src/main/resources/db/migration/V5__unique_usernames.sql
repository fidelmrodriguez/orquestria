-- Evolui contas existentes sem eliminar usuários, sessões, projetos ou workspaces.
-- Nomes de exibição são preservados; username passa a ser um identificador único.
ALTER TABLE app_users ADD COLUMN username VARCHAR(120);

-- Usuários antigos com nomes distintos poderão entrar pelo nome já utilizado no cadastro.
-- Se um nome antigo aparecer em mais de uma conta, a conta pessoal mais recente mantém
-- esse identificador. As outras recebem um identificador estável derivado do UUID;
-- todas continuam podendo entrar por e-mail. Nomes reservados, vazios ou com @ usam UUID.
WITH ranked AS (
    SELECT id, account_type, lower(btrim(name)) AS base,
           row_number() OVER (
               PARTITION BY lower(btrim(name))
               ORDER BY created_at DESC, id DESC
           ) AS position
    FROM app_users
)
UPDATE app_users AS u
SET username = CASE
    WHEN ranked.account_type = 'GUEST' THEN 'guest'
    WHEN ranked.base <> ''
      AND ranked.base <> 'guest'
      AND ranked.base NOT LIKE '%@%'
      AND ranked.position = 1
        THEN ranked.base
    ELSE 'user-' || replace(u.id::text, '-', '')
END
FROM ranked
WHERE u.id = ranked.id;

ALTER TABLE app_users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX ux_app_users_username_ci ON app_users (lower(username));
