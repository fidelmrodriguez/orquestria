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
  assert.equal(url, "https://orquestria-api.fidelmrodriguez.prod.page/actuator/health");
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

// A função publica o destino de navegação para despertar o Blitz pelo browser.
test("readiness STARTING fornece endereço de navegação do navegador", async () => {
  const { default: handler } = await import("../netlify/functions/orquestria-readiness.mjs");
  const previousFetch = global.fetch;
  const previousBase = process.env.ORQUESTRIA_API_URL;
  process.env.ORQUESTRIA_API_URL = "https://orquestria-api.fidelmrodriguez.prod.page";
  global.fetch = async () => new Response("<html>Waking</html>", { status: 200, headers: { "content-type": "text/html" } });
  try {
    const response = await handler(new Request("https://orquestria.netlify.app/api/orquestria-readiness"));
    const data = await response.json();
    assert.equal(response.status, 503);
    assert.equal(data.status, "STARTING");
    assert.equal(data.wakeUrl, "https://orquestria-api.fidelmrodriguez.prod.page/api/public/wake");
  } finally {
    global.fetch = previousFetch;
    if (previousBase === undefined) delete process.env.ORQUESTRIA_API_URL;
    else process.env.ORQUESTRIA_API_URL = previousBase;
  }
});
