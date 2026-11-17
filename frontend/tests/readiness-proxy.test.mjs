import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rules = readFileSync(new URL("../public/_redirects", import.meta.url), "utf8");
const proxyRule = rules.split(/\r?\n/).map(line => line.trim()).find(line => line.startsWith("/api/orquestria-readiness "));

test("readiness usa o proxy nativo do Netlify, nao uma Function", () => {
  assert.equal(proxyRule, "/api/orquestria-readiness  https://orquestria-api.fidelmrodriguez.prod.page/actuator/health  200!");
  assert.ok(!rules.includes("/.netlify/functions/orquestria-readiness"));
});

test("o destino usa HTTPS e somente o endpoint publico de saude", () => {
  const [, target] = proxyRule.split(/\s+/);
  const url = new URL(target);
  assert.equal(url.protocol, "https:");
  assert.equal(url.pathname, "/actuator/health");
  assert.equal(url.username, "");
  assert.equal(url.password, "");
});
