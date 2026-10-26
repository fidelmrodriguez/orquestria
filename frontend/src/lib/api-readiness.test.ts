import { probeApiReadiness } from "@/lib/api-readiness";

function fakeResponse(status: number, body: unknown, contentType = "application/json"): Response {
  return {
    status,
    headers: { get: (name: string) => name.toLowerCase() === "content-type" ? contentType : null },
    json: async () => body
  } as unknown as Response;
}

describe("readiness da API no Blitz", () => {
  const base = "https://orquestria-api.fidelmrodriguez.blitz.cloud";

  it("libera a aplicação apenas com health UP", async () => {
    const request = jest.fn().mockResolvedValue(fakeResponse(200, { status: "UP" }));
    expect(await probeApiReadiness(base, request as unknown as typeof fetch)).toEqual({ ready: true, source: "health" });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toBe(`${base}/actuator/health`);
  });

  it("não confunde o HTML de wake-up do Blitz com uma API pronta", async () => {
    const request = jest.fn().mockResolvedValue(fakeResponse(200, null, "text/html; charset=utf-8"));
    expect(await probeApiReadiness(base, request as unknown as typeof fetch)).toEqual({ ready: false, source: "health" });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("não libera a aplicação quando o Spring informa DOWN", async () => {
    const request = jest.fn().mockResolvedValue(fakeResponse(200, { status: "DOWN" }));
    expect((await probeApiReadiness(base, request as unknown as typeof fetch)).ready).toBe(false);
  });

  it("usa /api/auth/me anônimo quando o actuator está protegido", async () => {
    const request = jest.fn()
      .mockResolvedValueOnce(fakeResponse(403, null))
      .mockResolvedValueOnce(fakeResponse(401, null));
    expect(await probeApiReadiness(base, request as unknown as typeof fetch)).toEqual({ ready: true, source: "auth" });
    expect(request.mock.calls[1][0]).toBe(`${base}/api/auth/me`);
    const requestOptions = request.mock.calls[1][1] as RequestInit;
    expect(requestOptions.headers).not.toHaveProperty("Authorization");
  });

  it("não libera a aplicação quando a resposta ainda é de erro do gateway", async () => {
    const request = jest.fn().mockResolvedValue(fakeResponse(502, null, "text/html"));
    expect((await probeApiReadiness(base, request as unknown as typeof fetch)).ready).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("mantém a tela de preparação durante indisponibilidade de rede", async () => {
    const request = jest.fn().mockRejectedValue(new TypeError("network down"));
    expect(await probeApiReadiness(base, request as unknown as typeof fetch)).toEqual({ ready: false, source: "unavailable" });
  });
});
