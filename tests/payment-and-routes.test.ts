import { describe, expect, it } from "bun:test";
import { handlers } from "../src/lib/agent";

async function invoke(key: string, input: unknown) {
  return handlers.invoke(
    new Request(`http://localhost/api/agent/entrypoints/${key}/invoke`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
    }),
    { key },
  );
}

describe("routes and payment state", () => {
  it("health and entrypoints work without payment configuration", async () => {
    const health = await handlers.health(new Request("http://localhost/api/agent/health"));
    expect(health.status).toBe(200);
    const list = await handlers.entrypoints(new Request("http://localhost/api/agent/entrypoints"));
    expect(list.status).toBe(200);
    const body = (await list.json()) as { items: Array<{ key: string }> };
    expect(body.items.map((i) => i.key)).toEqual(expect.arrayContaining(["get-dataset-status", "preview-inference-chips", "rank-inference-chips", "compare-inference-chips"]));
  });

  it("serves agent-card and oasf discovery", async () => {
    const card = await handlers.manifest(new Request("http://localhost/api/agent/.well-known/agent-card.json"));
    expect(card.status).toBe(200);
    const oasf = await handlers.oasf(new Request("http://localhost/api/agent/.well-known/oasf-record.json"));
    expect([200, 404]).toContain(oasf.status);
  });

  it("free preview succeeds", async () => {
    const res = await invoke("preview-inference-chips", {});
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string; output: { rows: unknown[] } };
    expect(json.status).toBe("succeeded");
    expect(json.output.rows.length).toBeGreaterThan(0);
  });

  it("paid rank fails closed without payment configuration", async () => {
    const res = await invoke("rank-inference-chips", {
      sliceId: "v6.0|closed|llama3.1-8b|Offline|99|tokens_per_second",
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).not.toBe(200);
    const json = (await res.json()) as { error?: { code?: string }; status?: string };
    expect(JSON.stringify(json)).toMatch(/payment/i);
  });
});
