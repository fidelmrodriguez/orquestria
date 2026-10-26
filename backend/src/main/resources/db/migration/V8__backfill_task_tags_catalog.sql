-- Integra ao autocomplete as tags salvas em tarefas antes de existir um catálogo.
-- Preserva tarefas e grafia original; índices únicos da V7 ignoram duplicatas sem diferenciar caixa.
INSERT INTO user_tags(id, owner_id, name)
SELECT gen_random_uuid(), owner_id, name
FROM (
    SELECT DISTINCT p.owner_id AS owner_id, btrim(raw.tag) AS name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    CROSS JOIN LATERAL regexp_split_to_table(coalesce(t.tags_csv, ''), ',') AS raw(tag)
    WHERE p.owner_id IS NOT NULL
) existing
WHERE name <> '' AND length(name) <= 32
ON CONFLICT DO NOTHING;
