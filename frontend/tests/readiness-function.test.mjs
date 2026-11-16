import test from "node:test";
import assert from "node:assert/strict";
import { checkReadiness } from "../netlify/functions/orquestria-readiness.mjs";

const response = (status, contentType, payload) => ({
  status,
  headers: new Headers({ "content-type": contentType }),
  json: async () => payload
});

test("aceita somente health UP em JSON", async () => {
  let url;
  const result = await checkReadiness(async (target, options) => {
    url = target;
    assert.equal(options.redirect, "manual");
    return response(200, "application/json; charset=utf-8", { status: "UP" });
  });
  assert.equal(result, true);
  assert.equal(url, "https://orquestria-api.fidelmrodriguez.blitz.cloud/actuator/health");
});

test("não interpreta HTML do Blitz como API pronta", async () => {
  assert.equal(await checkReadiness(async () => response(200, "text/html", null)), false);
});

test("não libera no status DOWN ou em erro HTTP", async () => {
  assert.equal(await checkReadiness(async () => response(200, "application/json", { status: "DOWN" })), false);
  assert.equal(await checkReadiness(async () => response(502, "application/json", { status: "UP" })), false);
});

test("falha de rede não libera a aplicação", async () => {
  assert.equal(await checkReadiness(async () => { throw new TypeError("offline"); }), false);
});

test("rejeita base inválida para evitar destinos inesperados", async () => {
  let invoked = false;
  assert.equal(await checkReadiness(async () => { invoked = true; }, "http://localhost:8080"), false);
  assert.equal(invoked, false);
});
