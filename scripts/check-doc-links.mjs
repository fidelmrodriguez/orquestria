/** Valida caminhos Markdown locais sem acesso à internet ou dependências npm. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
const excludedDirs = new Set(['node_modules', '.git', '.next', 'out', 'target', 'coverage']);

function visit(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory()) {
      if (!excludedDirs.has(item.name)) visit(join(dir, item.name));
    } else if (item.isFile() && extname(item.name).toLowerCase() === '.md') {
      files.push(join(dir, item.name));
    }
  }
}

visit(root);
let count = 0;
const errors = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8').replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  const linkRegex = /!?\[[^\]]*\]\((<?[^\s)]+>?)\)/g;
  for (const match of text.matchAll(linkRegex)) {
    let target = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue;
    target = target.split(/[?#]/, 1)[0];
    if (!target) continue;
    try { target = decodeURIComponent(target); } catch { errors.push(`${relative(root, file)}: URL inválida ${target}`); continue; }
    const base = resolve(dirname(file), target);
    if (isAbsolute(target) || (!base.startsWith(root + sep) && base !== root)) {
      errors.push(`${relative(root, file)}: caminho fora do repositório ${target}`);
      continue;
    }
    count++;
    if (!existsSync(base) || (!statSync(base).isFile() && !statSync(base).isDirectory())) {
      errors.push(`${relative(root, file)}: destino ausente ${target}`);
    }
  }
}
if (errors.length) {
  for (const msg of errors) console.error(`ERRO: ${msg}`);
  console.error(`${errors.length} link(s) locais inválidos em ${files.length} arquivos Markdown.`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${count} link(s) locais verificados em ${files.length} arquivos Markdown.`);
}
