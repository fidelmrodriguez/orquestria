/** Regras puras de tags; identidade case-insensitive e limite de caracteres. */
export function normalizeTag(value: string): string {
  return value.replace(/,/g, " ").replace(/\s+/g, " ").trim().slice(0, 32);
}
export function addTag(tags: string[], raw: string, maxTags = 15): string[] {
  const tag = normalizeTag(raw);
  if (!tag || tags.length >= maxTags || tags.some(t => t.toLocaleLowerCase("pt-BR") === tag.toLocaleLowerCase("pt-BR"))) return tags;
  return [...tags, tag];
}
export function renameTag(tags: string[], index: number, raw: string): string[] {
  if (index < 0 || index >= tags.length) return tags;
  const name = normalizeTag(raw);
  if (!name || tags.some((tag, position) => position !== index && tag.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) return tags;
  return tags.map((tag, position) => position === index ? name : tag);
}
export function removeTag(tags: string[], index: number): string[] {
  return index < 0 || index >= tags.length ? tags : tags.filter((_, i) => i !== index);
}
